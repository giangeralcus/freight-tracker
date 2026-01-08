-- =============================================
-- MULTI-CURRENCY SYSTEM
-- Migration 001: Currencies and Exchange Rates
-- =============================================

-- =============================================
-- CURRENCIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,        -- ISO 4217: USD, IDR, AUD
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),                      -- $, Rp, A$
    decimal_places INTEGER DEFAULT 2,
    country VARCHAR(100),
    is_base BOOLEAN DEFAULT false,          -- IDR as base currency
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EXCHANGE RATE SOURCES
-- =============================================
CREATE TYPE rate_source AS ENUM ('BI', 'BCA', 'MANDIRI', 'MANUAL', 'API');

-- =============================================
-- EXCHANGE RATES TABLE (Weekly Fixed)
-- =============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency_id INTEGER REFERENCES currencies(id) ON DELETE CASCADE,
    to_currency_id INTEGER REFERENCES currencies(id) ON DELETE CASCADE,

    -- Rate info
    rate DECIMAL(18,6) NOT NULL,            -- 1 USD = 15,800 IDR
    rate_buy DECIMAL(18,6),                 -- Bank buy rate (optional)
    rate_sell DECIMAL(18,6),                -- Bank sell rate (optional)

    -- Source
    source rate_source DEFAULT 'MANUAL',
    source_reference VARCHAR(100),          -- e.g., "BCA TT Counter"

    -- Weekly validity period
    week_number INTEGER NOT NULL,           -- Week of year (1-53)
    year INTEGER NOT NULL,
    valid_from DATE NOT NULL,               -- Monday of the week
    valid_to DATE NOT NULL,                 -- Sunday of the week

    -- Status
    is_current BOOLEAN DEFAULT false,       -- Current week's rate

    -- Audit
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one rate per currency pair per week per source
    UNIQUE(from_currency_id, to_currency_id, week_number, year, source)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_currencies_code ON currencies(code);
CREATE INDEX idx_currencies_active ON currencies(is_active);

CREATE INDEX idx_exchange_rates_pair ON exchange_rates(from_currency_id, to_currency_id);
CREATE INDEX idx_exchange_rates_week ON exchange_rates(year, week_number);
CREATE INDEX idx_exchange_rates_validity ON exchange_rates(valid_from, valid_to);
CREATE INDEX idx_exchange_rates_current ON exchange_rates(is_current) WHERE is_current = true;
CREATE INDEX idx_exchange_rates_source ON exchange_rates(source);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get current exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(
    p_from_currency VARCHAR(3),
    p_to_currency VARCHAR(3),
    p_source rate_source DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(18,6) AS $$
DECLARE
    v_rate DECIMAL(18,6);
BEGIN
    -- If same currency, return 1
    IF p_from_currency = p_to_currency THEN
        RETURN 1.0;
    END IF;

    -- Get rate for the given date
    SELECT er.rate INTO v_rate
    FROM exchange_rates er
    JOIN currencies cf ON er.from_currency_id = cf.id
    JOIN currencies ct ON er.to_currency_id = ct.id
    WHERE cf.code = p_from_currency
      AND ct.code = p_to_currency
      AND p_date BETWEEN er.valid_from AND er.valid_to
      AND (p_source IS NULL OR er.source = p_source)
    ORDER BY
        CASE WHEN p_source IS NOT NULL THEN 0 ELSE 1 END,
        er.source = 'BI' DESC,  -- Prefer BI rate if no source specified
        er.created_at DESC
    LIMIT 1;

    -- If not found, try inverse rate
    IF v_rate IS NULL THEN
        SELECT 1.0 / er.rate INTO v_rate
        FROM exchange_rates er
        JOIN currencies cf ON er.from_currency_id = cf.id
        JOIN currencies ct ON er.to_currency_id = ct.id
        WHERE cf.code = p_to_currency
          AND ct.code = p_from_currency
          AND p_date BETWEEN er.valid_from AND er.valid_to
          AND (p_source IS NULL OR er.source = p_source)
        ORDER BY
            CASE WHEN p_source IS NOT NULL THEN 0 ELSE 1 END,
            er.source = 'BI' DESC,
            er.created_at DESC
        LIMIT 1;
    END IF;

    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to convert amount between currencies
CREATE OR REPLACE FUNCTION convert_currency(
    p_amount DECIMAL(18,2),
    p_from_currency VARCHAR(3),
    p_to_currency VARCHAR(3),
    p_source rate_source DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(18,2) AS $$
DECLARE
    v_rate DECIMAL(18,6);
BEGIN
    v_rate := get_exchange_rate(p_from_currency, p_to_currency, p_source, p_date);

    IF v_rate IS NULL THEN
        RAISE EXCEPTION 'Exchange rate not found for % to %', p_from_currency, p_to_currency;
    END IF;

    RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get week boundaries (Monday to Sunday)
CREATE OR REPLACE FUNCTION get_week_boundaries(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(week_start DATE, week_end DATE, week_num INTEGER, year_num INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('week', p_date)::DATE AS week_start,
        (DATE_TRUNC('week', p_date) + INTERVAL '6 days')::DATE AS week_end,
        EXTRACT(WEEK FROM p_date)::INTEGER AS week_num,
        EXTRACT(YEAR FROM p_date)::INTEGER AS year_num;
END;
$$ LANGUAGE plpgsql;

-- Function to set current week rates
CREATE OR REPLACE FUNCTION set_current_week_rates()
RETURNS void AS $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
BEGIN
    SELECT week_start, week_end INTO v_week_start, v_week_end
    FROM get_week_boundaries(CURRENT_DATE);

    -- Reset all is_current flags
    UPDATE exchange_rates SET is_current = false WHERE is_current = true;

    -- Set current week rates
    UPDATE exchange_rates
    SET is_current = true
    WHERE valid_from = v_week_start AND valid_to = v_week_end;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS
-- =============================================

-- Current week rates view
CREATE OR REPLACE VIEW v_current_exchange_rates AS
SELECT
    er.id,
    cf.code AS from_currency,
    cf.name AS from_currency_name,
    ct.code AS to_currency,
    ct.name AS to_currency_name,
    er.rate,
    er.rate_buy,
    er.rate_sell,
    er.source,
    er.source_reference,
    er.week_number,
    er.year,
    er.valid_from,
    er.valid_to,
    er.notes,
    er.created_at,
    er.updated_at
FROM exchange_rates er
JOIN currencies cf ON er.from_currency_id = cf.id
JOIN currencies ct ON er.to_currency_id = ct.id
WHERE er.is_current = true
ORDER BY cf.sort_order, ct.sort_order;

-- Rate history view (last 12 weeks)
CREATE OR REPLACE VIEW v_exchange_rate_history AS
SELECT
    er.id,
    cf.code AS from_currency,
    ct.code AS to_currency,
    er.rate,
    er.source,
    er.week_number,
    er.year,
    er.valid_from,
    er.valid_to,
    LAG(er.rate) OVER (
        PARTITION BY er.from_currency_id, er.to_currency_id, er.source
        ORDER BY er.year, er.week_number
    ) AS prev_rate,
    CASE
        WHEN LAG(er.rate) OVER (
            PARTITION BY er.from_currency_id, er.to_currency_id, er.source
            ORDER BY er.year, er.week_number
        ) > 0 THEN
            ROUND(((er.rate - LAG(er.rate) OVER (
                PARTITION BY er.from_currency_id, er.to_currency_id, er.source
                ORDER BY er.year, er.week_number
            )) / LAG(er.rate) OVER (
                PARTITION BY er.from_currency_id, er.to_currency_id, er.source
                ORDER BY er.year, er.week_number
            )) * 100, 2)
        ELSE NULL
    END AS change_percent
FROM exchange_rates er
JOIN currencies cf ON er.from_currency_id = cf.id
JOIN currencies ct ON er.to_currency_id = ct.id
WHERE er.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
ORDER BY er.year DESC, er.week_number DESC, cf.code, ct.code;

-- =============================================
-- SEED DATA: CURRENCIES
-- =============================================
INSERT INTO currencies (code, name, symbol, decimal_places, country, is_base, is_active, sort_order) VALUES
('IDR', 'Indonesian Rupiah', 'Rp', 0, 'Indonesia', true, true, 1),
('USD', 'US Dollar', '$', 2, 'United States', false, true, 2),
('AUD', 'Australian Dollar', 'A$', 2, 'Australia', false, true, 3),
('SGD', 'Singapore Dollar', 'S$', 2, 'Singapore', false, true, 4),
('EUR', 'Euro', '€', 2, 'European Union', false, true, 5),
('GBP', 'British Pound', '£', 2, 'United Kingdom', false, true, 6),
('JPY', 'Japanese Yen', '¥', 0, 'Japan', false, true, 7),
('CNY', 'Chinese Yuan', '¥', 2, 'China', false, true, 8),
('HKD', 'Hong Kong Dollar', 'HK$', 2, 'Hong Kong', false, true, 9),
('CAD', 'Canadian Dollar', 'C$', 2, 'Canada', false, true, 10),
('MYR', 'Malaysian Ringgit', 'RM', 2, 'Malaysia', false, true, 11),
('THB', 'Thai Baht', '฿', 2, 'Thailand', false, true, 12),
('KRW', 'South Korean Won', '₩', 0, 'South Korea', false, true, 13),
('INR', 'Indian Rupee', '₹', 2, 'India', false, true, 14),
('AED', 'UAE Dirham', 'د.إ', 2, 'United Arab Emirates', false, true, 15)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- SEED DATA: SAMPLE EXCHANGE RATES (Current Week)
-- =============================================
DO $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
    v_week_num INTEGER;
    v_year INTEGER;
    v_usd_id INTEGER;
    v_idr_id INTEGER;
    v_aud_id INTEGER;
    v_sgd_id INTEGER;
    v_eur_id INTEGER;
    v_gbp_id INTEGER;
    v_jpy_id INTEGER;
    v_cny_id INTEGER;
BEGIN
    -- Get current week boundaries
    SELECT week_start, week_end, week_num, year_num
    INTO v_week_start, v_week_end, v_week_num, v_year
    FROM get_week_boundaries(CURRENT_DATE);

    -- Get currency IDs
    SELECT id INTO v_usd_id FROM currencies WHERE code = 'USD';
    SELECT id INTO v_idr_id FROM currencies WHERE code = 'IDR';
    SELECT id INTO v_aud_id FROM currencies WHERE code = 'AUD';
    SELECT id INTO v_sgd_id FROM currencies WHERE code = 'SGD';
    SELECT id INTO v_eur_id FROM currencies WHERE code = 'EUR';
    SELECT id INTO v_gbp_id FROM currencies WHERE code = 'GBP';
    SELECT id INTO v_jpy_id FROM currencies WHERE code = 'JPY';
    SELECT id INTO v_cny_id FROM currencies WHERE code = 'CNY';

    -- Insert USD to IDR rates from different sources
    INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate, rate_buy, rate_sell, source, source_reference, week_number, year, valid_from, valid_to, is_current, notes)
    VALUES
    -- Bank Indonesia (Kurs Tengah)
    (v_usd_id, v_idr_id, 15850.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, 'Kurs referensi Bank Indonesia'),

    -- BCA (TT Counter)
    (v_usd_id, v_idr_id, 15800.00, 15700.00, 15900.00, 'BCA', 'TT Counter', v_week_num, v_year, v_week_start, v_week_end, true, 'Rate BCA TT Counter'),

    -- Mandiri
    (v_usd_id, v_idr_id, 15820.00, 15720.00, 15920.00, 'MANDIRI', 'Special Rate', v_week_num, v_year, v_week_start, v_week_end, true, 'Rate Mandiri Special'),

    -- Other currencies to IDR (BI rates)
    (v_aud_id, v_idr_id, 10250.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL),
    (v_sgd_id, v_idr_id, 11750.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL),
    (v_eur_id, v_idr_id, 17200.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL),
    (v_gbp_id, v_idr_id, 20100.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL),
    (v_jpy_id, v_idr_id, 105.50, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL),
    (v_cny_id, v_idr_id, 2180.00, NULL, NULL, 'BI', 'Kurs Tengah BI', v_week_num, v_year, v_week_start, v_week_end, true, NULL)
    ON CONFLICT (from_currency_id, to_currency_id, week_number, year, source) DO UPDATE
    SET rate = EXCLUDED.rate, rate_buy = EXCLUDED.rate_buy, rate_sell = EXCLUDED.rate_sell, is_current = true;

END $$;

-- =============================================
-- UPDATE SETTINGS TABLE
-- =============================================
INSERT INTO settings (key, value, description) VALUES
('default_rate_source', 'BI', 'Default exchange rate source for calculations'),
('rate_lock_day', 'MONDAY', 'Day when weekly rates are locked')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE currencies IS 'Supported currencies with ISO 4217 codes';
COMMENT ON TABLE exchange_rates IS 'Weekly exchange rates from multiple sources';
COMMENT ON FUNCTION get_exchange_rate IS 'Get exchange rate for a currency pair on a specific date';
COMMENT ON FUNCTION convert_currency IS 'Convert amount between currencies';
COMMENT ON VIEW v_current_exchange_rates IS 'Current week exchange rates';
COMMENT ON VIEW v_exchange_rate_history IS 'Exchange rate history with week-over-week change';

SELECT 'Multi-currency migration completed successfully!' AS message;
