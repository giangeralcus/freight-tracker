-- =============================================
-- FREIGHT TRACKER DATABASE SCHEMA
-- PT Gateway Prima Indonusa
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    payment_terms INTEGER DEFAULT 30, -- days
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VENDORS TABLE (Coloaders, Shipping Lines, Airlines)
-- =============================================
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('COLOADER', 'SHIPPING_LINE', 'AIRLINE', 'TRUCKING', 'WAREHOUSE')),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    payment_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PORTS TABLE
-- =============================================
CREATE TABLE ports (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- UN/LOCODE format: IDJKT, AUBNE, etc.
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(2),
    port_type VARCHAR(20) DEFAULT 'SEA' CHECK (port_type IN ('SEA', 'AIR', 'BOTH')),
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CARRIERS TABLE
-- =============================================
CREATE TABLE carriers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    carrier_type VARCHAR(20) NOT NULL CHECK (carrier_type IN ('SHIPPING_LINE', 'AIRLINE')),
    scac_code VARCHAR(10), -- Standard Carrier Alpha Code
    iata_code VARCHAR(3), -- For airlines
    website VARCHAR(255),
    tracking_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VENDOR RATES - SEA (FCL Rates)
-- =============================================
CREATE TABLE vendor_rates_sea (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    carrier_id INTEGER REFERENCES carriers(id),
    pol_id INTEGER REFERENCES ports(id), -- Port of Loading
    pod_id INTEGER REFERENCES ports(id), -- Port of Discharge
    container_type VARCHAR(10) NOT NULL CHECK (container_type IN ('20GP', '40GP', '40HC', '45HC', '20RF', '40RF')),
    rate_usd DECIMAL(12,2) NOT NULL,
    transit_days INTEGER,
    free_time_days INTEGER DEFAULT 14,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VENDOR SURCHARGES
-- =============================================
CREATE TABLE vendor_surcharges (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    charge_code VARCHAR(20) NOT NULL, -- THC, DOC, AMS, ISF, etc.
    charge_name VARCHAR(100) NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'ORIGIN' CHECK (charge_type IN ('ORIGIN', 'DESTINATION', 'FREIGHT')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    unit VARCHAR(20) DEFAULT 'PER_CONTAINER' CHECK (unit IN ('PER_CONTAINER', 'PER_BL', 'PER_CBM', 'PER_KG', 'LUMPSUM')),
    pol_id INTEGER REFERENCES ports(id),
    pod_id INTEGER REFERENCES ports(id),
    valid_from DATE,
    valid_to DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INQUIRIES (Customer Inquiries from Email)
-- =============================================
CREATE TABLE inquiries (
    id SERIAL PRIMARY KEY,
    inquiry_number VARCHAR(50) UNIQUE NOT NULL,
    inquiry_date DATE DEFAULT CURRENT_DATE,
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),

    -- Shipment Details (parsed from email)
    incoterm VARCHAR(10),
    service_type VARCHAR(10) CHECK (service_type IN ('FCL', 'LCL', 'AIR')),
    pol VARCHAR(100),
    pol_id INTEGER REFERENCES ports(id),
    pod VARCHAR(100),
    pod_id INTEGER REFERENCES ports(id),
    commodity VARCHAR(255),
    is_dg BOOLEAN DEFAULT false,
    dg_class VARCHAR(20),
    un_number VARCHAR(20),

    -- Cargo Details
    weight_kg DECIMAL(12,2),
    volume_cbm DECIMAL(12,3),
    container_type VARCHAR(10),
    container_qty INTEGER,

    -- Requirements
    freetime_days INTEGER,
    reference_bl VARCHAR(100),

    -- Status
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST', 'CANCELLED')),

    -- Original Email
    email_subject TEXT,
    email_body TEXT,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- QUOTATIONS
-- =============================================
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    quote_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,

    inquiry_id INTEGER REFERENCES inquiries(id),
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,

    -- Route
    incoterm VARCHAR(10),
    service_type VARCHAR(10) CHECK (service_type IN ('FCL', 'LCL', 'AIR')),
    pol_id INTEGER REFERENCES ports(id),
    pod_id INTEGER REFERENCES ports(id),

    -- Cargo
    commodity VARCHAR(255),
    is_dg BOOLEAN DEFAULT false,
    dg_class VARCHAR(20),
    container_type VARCHAR(10),
    container_qty INTEGER DEFAULT 1,
    weight_kg DECIMAL(12,2),
    volume_cbm DECIMAL(12,3),

    -- Totals
    total_cost_usd DECIMAL(15,2) DEFAULT 0,
    total_revenue_usd DECIMAL(15,2) DEFAULT 0,
    profit_usd DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,

    -- Currency conversion
    exchange_rate DECIMAL(10,2), -- USD to IDR
    total_cost_idr DECIMAL(15,0),
    total_revenue_idr DECIMAL(15,0),
    profit_idr DECIMAL(15,0),

    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    notes TEXT,

    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- QUOTATION ITEMS (Line Items with Cost/Revenue)
-- =============================================
CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,

    charge_code VARCHAR(20) NOT NULL,
    charge_name VARCHAR(100) NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'ORIGIN' CHECK (charge_type IN ('ORIGIN', 'FREIGHT', 'DESTINATION')),

    vendor_id INTEGER REFERENCES vendors(id),

    -- Cost (what we pay)
    cost_amount DECIMAL(12,2) DEFAULT 0,
    cost_currency VARCHAR(3) DEFAULT 'USD',

    -- Revenue (what we charge customer)
    sell_amount DECIMAL(12,2) DEFAULT 0,
    sell_currency VARCHAR(3) DEFAULT 'USD',

    unit VARCHAR(20) DEFAULT 'PER_CONTAINER',
    quantity DECIMAL(10,2) DEFAULT 1,

    -- Calculated
    total_cost DECIMAL(12,2) DEFAULT 0,
    total_sell DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) DEFAULT 0,

    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SHIPMENTS (Confirmed Bookings with Actual Costs)
-- =============================================
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    booking_date DATE DEFAULT CURRENT_DATE,

    quotation_id INTEGER REFERENCES quotations(id),
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,

    -- Vendor/Coloader
    vendor_id INTEGER REFERENCES vendors(id),
    carrier_id INTEGER REFERENCES carriers(id),

    -- Route
    incoterm VARCHAR(10),
    service_type VARCHAR(10) CHECK (service_type IN ('FCL', 'LCL', 'AIR')),
    pol_id INTEGER REFERENCES ports(id),
    pod_id INTEGER REFERENCES ports(id),

    -- Vessel/Flight
    vessel_name VARCHAR(255),
    voyage_number VARCHAR(50),
    etd DATE,
    eta DATE,

    -- Cargo
    commodity VARCHAR(255),
    is_dg BOOLEAN DEFAULT false,
    container_type VARCHAR(10),
    container_qty INTEGER DEFAULT 1,
    bl_number VARCHAR(100),

    -- Financials (Quoted vs Actual)
    quoted_cost_usd DECIMAL(15,2) DEFAULT 0,
    quoted_revenue_usd DECIMAL(15,2) DEFAULT 0,
    quoted_profit_usd DECIMAL(15,2) DEFAULT 0,

    actual_cost_usd DECIMAL(15,2) DEFAULT 0,
    actual_revenue_usd DECIMAL(15,2) DEFAULT 0,
    actual_profit_usd DECIMAL(15,2) DEFAULT 0,

    -- Currency conversion
    exchange_rate DECIMAL(10,2),
    actual_profit_idr DECIMAL(15,0),

    -- Payment
    invoice_number VARCHAR(50),
    invoice_date DATE,
    payment_due_date DATE,
    payment_received_date DATE,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'INVOICED', 'PARTIAL', 'PAID', 'OVERDUE')),

    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
    notes TEXT,

    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SHIPMENT ITEMS (Actual Costs per Shipment)
-- =============================================
CREATE TABLE shipment_items (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,

    charge_code VARCHAR(20) NOT NULL,
    charge_name VARCHAR(100) NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'ORIGIN',

    vendor_id INTEGER REFERENCES vendors(id),

    -- Actual amounts
    cost_amount DECIMAL(12,2) DEFAULT 0,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    sell_amount DECIMAL(12,2) DEFAULT 0,
    sell_currency VARCHAR(3) DEFAULT 'USD',

    quantity DECIMAL(10,2) DEFAULT 1,
    total_cost DECIMAL(12,2) DEFAULT 0,
    total_sell DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) DEFAULT 0,

    -- Invoice tracking
    vendor_invoice_no VARCHAR(100),
    vendor_invoice_date DATE,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_vendors_code ON vendors(code);
CREATE INDEX idx_ports_code ON ports(code);
CREATE INDEX idx_carriers_code ON carriers(code);

CREATE INDEX idx_vendor_rates_sea_route ON vendor_rates_sea(pol_id, pod_id);
CREATE INDEX idx_vendor_rates_sea_validity ON vendor_rates_sea(valid_from, valid_to);
CREATE INDEX idx_vendor_surcharges_vendor ON vendor_surcharges(vendor_id);

CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_date ON inquiries(inquiry_date);
CREATE INDEX idx_inquiries_customer ON inquiries(customer_id);

CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_date ON quotations(quote_date);
CREATE INDEX idx_quotations_status ON quotations(status);

CREATE INDEX idx_shipments_customer ON shipments(customer_id);
CREATE INDEX idx_shipments_date ON shipments(booking_date);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_payment ON shipments(payment_status);

-- =============================================
-- VIEWS FOR PROFIT ANALYSIS
-- =============================================

-- Monthly Profit View
CREATE OR REPLACE VIEW v_monthly_profit AS
SELECT
    DATE_TRUNC('month', s.booking_date) AS month,
    COUNT(*) AS shipment_count,
    SUM(s.actual_revenue_usd) AS total_revenue_usd,
    SUM(s.actual_cost_usd) AS total_cost_usd,
    SUM(s.actual_profit_usd) AS total_profit_usd,
    CASE
        WHEN SUM(s.actual_revenue_usd) > 0
        THEN ROUND((SUM(s.actual_profit_usd) / SUM(s.actual_revenue_usd)) * 100, 2)
        ELSE 0
    END AS margin_percentage
FROM shipments s
WHERE s.status != 'CANCELLED'
GROUP BY DATE_TRUNC('month', s.booking_date)
ORDER BY month DESC;

-- Customer Profit View
CREATE OR REPLACE VIEW v_customer_profit AS
SELECT
    c.id AS customer_id,
    c.code AS customer_code,
    c.name AS customer_name,
    COUNT(s.id) AS shipment_count,
    SUM(s.actual_revenue_usd) AS total_revenue_usd,
    SUM(s.actual_cost_usd) AS total_cost_usd,
    SUM(s.actual_profit_usd) AS total_profit_usd,
    CASE
        WHEN SUM(s.actual_revenue_usd) > 0
        THEN ROUND((SUM(s.actual_profit_usd) / SUM(s.actual_revenue_usd)) * 100, 2)
        ELSE 0
    END AS margin_percentage,
    MAX(s.booking_date) AS last_shipment_date
FROM customers c
LEFT JOIN shipments s ON c.id = s.customer_id AND s.status != 'CANCELLED'
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name
ORDER BY total_profit_usd DESC NULLS LAST;

-- Route Profit View
CREATE OR REPLACE VIEW v_route_profit AS
SELECT
    pol.code AS pol_code,
    pol.name AS pol_name,
    pod.code AS pod_code,
    pod.name AS pod_name,
    s.service_type,
    COUNT(s.id) AS shipment_count,
    SUM(s.actual_revenue_usd) AS total_revenue_usd,
    SUM(s.actual_cost_usd) AS total_cost_usd,
    SUM(s.actual_profit_usd) AS total_profit_usd,
    CASE
        WHEN SUM(s.actual_revenue_usd) > 0
        THEN ROUND((SUM(s.actual_profit_usd) / SUM(s.actual_revenue_usd)) * 100, 2)
        ELSE 0
    END AS margin_percentage
FROM shipments s
JOIN ports pol ON s.pol_id = pol.id
JOIN ports pod ON s.pod_id = pod.id
WHERE s.status != 'CANCELLED'
GROUP BY pol.code, pol.name, pod.code, pod.name, s.service_type
ORDER BY total_profit_usd DESC;

-- Dashboard Summary View
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM shipments WHERE status NOT IN ('CANCELLED', 'COMPLETED')) AS active_shipments,
    (SELECT COUNT(*) FROM inquiries WHERE status = 'NEW') AS pending_inquiries,
    (SELECT COUNT(*) FROM quotations WHERE status = 'SENT' AND valid_until >= CURRENT_DATE) AS active_quotes,
    (SELECT COUNT(*) FROM shipments WHERE payment_status = 'OVERDUE') AS overdue_payments,
    (SELECT COALESCE(SUM(actual_profit_usd), 0) FROM shipments WHERE DATE_TRUNC('month', booking_date) = DATE_TRUNC('month', CURRENT_DATE)) AS mtd_profit_usd,
    (SELECT COALESCE(SUM(actual_profit_usd), 0) FROM shipments WHERE DATE_TRUNC('year', booking_date) = DATE_TRUNC('year', CURRENT_DATE)) AS ytd_profit_usd;

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON inquiries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate quotation totals
CREATE OR REPLACE FUNCTION calculate_quotation_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotations SET
        total_cost_usd = (SELECT COALESCE(SUM(total_cost), 0) FROM quotation_items WHERE quotation_id = NEW.quotation_id),
        total_revenue_usd = (SELECT COALESCE(SUM(total_sell), 0) FROM quotation_items WHERE quotation_id = NEW.quotation_id),
        profit_usd = (SELECT COALESCE(SUM(profit), 0) FROM quotation_items WHERE quotation_id = NEW.quotation_id)
    WHERE id = NEW.quotation_id;

    UPDATE quotations SET
        profit_margin = CASE
            WHEN total_revenue_usd > 0 THEN ROUND((profit_usd / total_revenue_usd) * 100, 2)
            ELSE 0
        END
    WHERE id = NEW.quotation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quotation_items_totals AFTER INSERT OR UPDATE OR DELETE ON quotation_items
FOR EACH ROW EXECUTE FUNCTION calculate_quotation_totals();

-- Auto-calculate shipment totals
CREATE OR REPLACE FUNCTION calculate_shipment_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shipments SET
        actual_cost_usd = (SELECT COALESCE(SUM(total_cost), 0) FROM shipment_items WHERE shipment_id = NEW.shipment_id),
        actual_revenue_usd = (SELECT COALESCE(SUM(total_sell), 0) FROM shipment_items WHERE shipment_id = NEW.shipment_id),
        actual_profit_usd = (SELECT COALESCE(SUM(profit), 0) FROM shipment_items WHERE shipment_id = NEW.shipment_id)
    WHERE id = NEW.shipment_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shipment_items_totals AFTER INSERT OR UPDATE OR DELETE ON shipment_items
FOR EACH ROW EXECUTE FUNCTION calculate_shipment_totals();

-- Function to generate inquiry number
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR(50);
    seq_no INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(inquiry_number FROM 'INQ/GPI/\d{4}/\d{2}/(\d+)') AS INTEGER)), 0) + 1
    INTO seq_no
    FROM inquiries
    WHERE inquiry_number LIKE 'INQ/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM') || '/%';

    new_number := 'INQ/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM/') || LPAD(seq_no::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quotation number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR(50);
    seq_no INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'QT/GPI/\d{4}/\d{2}/(\d+)') AS INTEGER)), 0) + 1
    INTO seq_no
    FROM quotations
    WHERE quote_number LIKE 'QT/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM') || '/%';

    new_number := 'QT/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM/') || LPAD(seq_no::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR(50);
    seq_no INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB/GPI/\d{4}/\d{2}/(\d+)') AS INTEGER)), 0) + 1
    INTO seq_no
    FROM shipments
    WHERE job_number LIKE 'JOB/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM') || '/%';

    new_number := 'JOB/GPI/' || TO_CHAR(CURRENT_DATE, 'YYYY/MM/') || LPAD(seq_no::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE settings IS 'Application settings: exchange rate, default markup, VAT rate, etc.';
COMMENT ON TABLE customers IS 'Customer master data with payment terms and credit limits';
COMMENT ON TABLE vendors IS 'Vendors: coloaders, shipping lines, airlines, trucking companies';
COMMENT ON TABLE ports IS 'Port reference data with UN/LOCODE';
COMMENT ON TABLE carriers IS 'Shipping lines and airlines';
COMMENT ON TABLE vendor_rates_sea IS 'FCL rates from vendors with validity periods';
COMMENT ON TABLE vendor_surcharges IS 'Additional charges: THC, DOC, AMS, ISF, etc.';
COMMENT ON TABLE inquiries IS 'Customer inquiries parsed from emails';
COMMENT ON TABLE quotations IS 'Quotations with cost/revenue breakdown';
COMMENT ON TABLE quotation_items IS 'Line items for quotations';
COMMENT ON TABLE shipments IS 'Confirmed shipments with actual costs';
COMMENT ON TABLE shipment_items IS 'Actual cost items per shipment';

COMMENT ON VIEW v_monthly_profit IS 'Monthly profit analysis';
COMMENT ON VIEW v_customer_profit IS 'Profit analysis by customer';
COMMENT ON VIEW v_route_profit IS 'Profit analysis by route (POL-POD)';
COMMENT ON VIEW v_dashboard_summary IS 'Dashboard KPIs';
