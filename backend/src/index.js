import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'freight_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================
// DASHBOARD ENDPOINTS
// =============================================

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_dashboard_summary');
    res.json(result.rows[0] || {
      active_shipments: 0,
      pending_inquiries: 0,
      active_quotes: 0,
      overdue_payments: 0,
      mtd_profit_usd: 0,
      ytd_profit_usd: 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// =============================================
// SETTINGS ENDPOINTS
// =============================================

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const result = await pool.query(
      'UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
      [value, key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// =============================================
// CURRENCIES ENDPOINTS
// =============================================

// Get all currencies
app.get('/api/currencies', async (req, res) => {
  try {
    const { active } = req.query;
    let query = 'SELECT * FROM currencies';
    const params = [];

    if (active !== undefined) {
      query += ' WHERE is_active = $1';
      params.push(active === 'true');
    }
    query += ' ORDER BY sort_order';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get base currency
app.get('/api/currencies/base', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM currencies WHERE is_base = true LIMIT 1');
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching base currency:', error);
    res.status(500).json({ error: 'Failed to fetch base currency' });
  }
});

// =============================================
// EXCHANGE RATES ENDPOINTS
// =============================================

// Get current week rates
app.get('/api/exchange-rates/current', async (req, res) => {
  try {
    const { source } = req.query;
    let query = 'SELECT * FROM v_current_exchange_rates';
    const params = [];

    if (source) {
      query = `SELECT * FROM v_current_exchange_rates WHERE source = $1`;
      params.push(source);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching current rates:', error);
    res.status(500).json({ error: 'Failed to fetch current rates' });
  }
});

// Get rate history
app.get('/api/exchange-rates/history', async (req, res) => {
  try {
    const { from_currency, to_currency, source, limit } = req.query;
    let query = 'SELECT * FROM v_exchange_rate_history WHERE 1=1';
    const params = [];

    if (from_currency) {
      params.push(from_currency);
      query += ` AND from_currency = $${params.length}`;
    }
    if (to_currency) {
      params.push(to_currency);
      query += ` AND to_currency = $${params.length}`;
    }
    if (source) {
      params.push(source);
      query += ` AND source = $${params.length}`;
    }

    query += ' ORDER BY year DESC, week_number DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rate history:', error);
    res.status(500).json({ error: 'Failed to fetch rate history' });
  }
});

// Get specific rate for conversion
app.get('/api/exchange-rates/rate', async (req, res) => {
  try {
    const { from, to, source, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to currency codes are required' });
    }

    const result = await pool.query(
      'SELECT get_exchange_rate($1, $2, $3, $4) as rate',
      [from, to, source || null, date || new Date().toISOString().split('T')[0]]
    );

    const rate = result.rows[0]?.rate;
    if (!rate) {
      return res.status(404).json({ error: `Exchange rate not found for ${from} to ${to}` });
    }

    res.json({
      from_currency: from,
      to_currency: to,
      rate: parseFloat(rate),
      source: source || 'BI',
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// Convert currency amount
app.post('/api/exchange-rates/convert', async (req, res) => {
  try {
    const { amount, from, to, source, date } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'amount, from, and to are required' });
    }

    const result = await pool.query(
      'SELECT convert_currency($1, $2, $3, $4, $5) as converted_amount',
      [amount, from, to, source || null, date || new Date().toISOString().split('T')[0]]
    );

    const converted = result.rows[0]?.converted_amount;
    if (converted === null) {
      return res.status(404).json({ error: `Cannot convert ${from} to ${to}` });
    }

    // Get the rate used
    const rateResult = await pool.query(
      'SELECT get_exchange_rate($1, $2, $3, $4) as rate',
      [from, to, source || null, date || new Date().toISOString().split('T')[0]]
    );

    res.json({
      original_amount: parseFloat(amount),
      from_currency: from,
      converted_amount: parseFloat(converted),
      to_currency: to,
      rate_used: parseFloat(rateResult.rows[0]?.rate || 0),
      source: source || 'BI',
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Create new weekly rate
app.post('/api/exchange-rates', async (req, res) => {
  try {
    const {
      from_currency,
      to_currency,
      rate,
      rate_buy,
      rate_sell,
      source,
      source_reference,
      week_start, // Optional: defaults to current week
      notes,
      created_by
    } = req.body;

    if (!from_currency || !to_currency || !rate) {
      return res.status(400).json({ error: 'from_currency, to_currency, and rate are required' });
    }

    // Get currency IDs
    const fromCurrency = await pool.query('SELECT id FROM currencies WHERE code = $1', [from_currency]);
    const toCurrency = await pool.query('SELECT id FROM currencies WHERE code = $1', [to_currency]);

    if (fromCurrency.rows.length === 0 || toCurrency.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }

    // Get week boundaries
    const weekDate = week_start || new Date().toISOString().split('T')[0];
    const weekBoundaries = await pool.query('SELECT * FROM get_week_boundaries($1)', [weekDate]);
    const { week_start: validFrom, week_end: validTo, week_num, year_num } = weekBoundaries.rows[0];

    // Insert rate
    const result = await pool.query(`
      INSERT INTO exchange_rates (
        from_currency_id, to_currency_id, rate, rate_buy, rate_sell,
        source, source_reference, week_number, year, valid_from, valid_to,
        is_current, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (from_currency_id, to_currency_id, week_number, year, source)
      DO UPDATE SET
        rate = EXCLUDED.rate,
        rate_buy = EXCLUDED.rate_buy,
        rate_sell = EXCLUDED.rate_sell,
        source_reference = EXCLUDED.source_reference,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `, [
      fromCurrency.rows[0].id,
      toCurrency.rows[0].id,
      rate,
      rate_buy || null,
      rate_sell || null,
      source || 'MANUAL',
      source_reference || null,
      week_num,
      year_num,
      validFrom,
      validTo,
      validFrom <= new Date() && new Date() <= validTo,
      notes || null,
      created_by || null
    ]);

    // Update is_current flags
    await pool.query('SELECT set_current_week_rates()');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating exchange rate:', error);
    res.status(500).json({ error: 'Failed to create exchange rate' });
  }
});

// Bulk update weekly rates
app.post('/api/exchange-rates/bulk', async (req, res) => {
  try {
    const { rates, week_start, source, created_by } = req.body;

    if (!rates || !Array.isArray(rates) || rates.length === 0) {
      return res.status(400).json({ error: 'rates array is required' });
    }

    const weekDate = week_start || new Date().toISOString().split('T')[0];
    const weekBoundaries = await pool.query('SELECT * FROM get_week_boundaries($1)', [weekDate]);
    const { week_start: validFrom, week_end: validTo, week_num, year_num } = weekBoundaries.rows[0];

    const results = [];
    for (const rateData of rates) {
      const { from_currency, to_currency, rate, rate_buy, rate_sell, source_reference, notes } = rateData;

      const fromCurrency = await pool.query('SELECT id FROM currencies WHERE code = $1', [from_currency]);
      const toCurrency = await pool.query('SELECT id FROM currencies WHERE code = $1', [to_currency]);

      if (fromCurrency.rows.length === 0 || toCurrency.rows.length === 0) {
        continue;
      }

      const result = await pool.query(`
        INSERT INTO exchange_rates (
          from_currency_id, to_currency_id, rate, rate_buy, rate_sell,
          source, source_reference, week_number, year, valid_from, valid_to,
          is_current, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (from_currency_id, to_currency_id, week_number, year, source)
        DO UPDATE SET
          rate = EXCLUDED.rate,
          rate_buy = EXCLUDED.rate_buy,
          rate_sell = EXCLUDED.rate_sell,
          updated_at = NOW()
        RETURNING *
      `, [
        fromCurrency.rows[0].id,
        toCurrency.rows[0].id,
        rate,
        rate_buy || null,
        rate_sell || null,
        source || 'MANUAL',
        source_reference || null,
        week_num,
        year_num,
        validFrom,
        validTo,
        true,
        notes || null,
        created_by || null
      ]);

      results.push(result.rows[0]);
    }

    await pool.query('SELECT set_current_week_rates()');

    res.status(201).json({
      message: `${results.length} rates updated`,
      week_number: week_num,
      year: year_num,
      valid_from: validFrom,
      valid_to: validTo,
      rates: results
    });
  } catch (error) {
    console.error('Error bulk updating rates:', error);
    res.status(500).json({ error: 'Failed to bulk update rates' });
  }
});

// =============================================
// CUSTOMERS ENDPOINTS
// =============================================

app.get('/api/customers', async (req, res) => {
  try {
    const { active } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];

    if (active !== undefined) {
      query += ' WHERE is_active = $1';
      params.push(active === 'true');
    }
    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { code, name, address, city, country, phone, email, contact_person, payment_terms, credit_limit, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (code, name, address, city, country, phone, email, contact_person, payment_terms, credit_limit, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [code, name, address, city, country, phone, email, contact_person, payment_terms || 30, credit_limit || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// =============================================
// VENDORS ENDPOINTS
// =============================================

app.get('/api/vendors', async (req, res) => {
  try {
    const { type, active } = req.query;
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND vendor_type = $${params.length}`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND is_active = $${params.length}`;
    }
    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// =============================================
// PORTS ENDPOINTS
// =============================================

app.get('/api/ports', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM ports WHERE is_active = true';
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND (port_type = $${params.length} OR port_type = 'BOTH')`;
    }
    query += ' ORDER BY country, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ports:', error);
    res.status(500).json({ error: 'Failed to fetch ports' });
  }
});

// =============================================
// CARRIERS ENDPOINTS
// =============================================

app.get('/api/carriers', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM carriers WHERE is_active = true';
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND carrier_type = $${params.length}`;
    }
    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
});

// =============================================
// VENDOR RATES ENDPOINTS
// =============================================

app.get('/api/vendor-rates/sea', async (req, res) => {
  try {
    const { pol_id, pod_id, container_type, valid_date } = req.query;
    let query = `
      SELECT vr.*,
             v.name as vendor_name, v.code as vendor_code,
             c.name as carrier_name, c.code as carrier_code,
             pol.code as pol_code, pol.name as pol_name,
             pod.code as pod_code, pod.name as pod_name
      FROM vendor_rates_sea vr
      LEFT JOIN vendors v ON vr.vendor_id = v.id
      LEFT JOIN carriers c ON vr.carrier_id = c.id
      LEFT JOIN ports pol ON vr.pol_id = pol.id
      LEFT JOIN ports pod ON vr.pod_id = pod.id
      WHERE vr.is_active = true
    `;
    const params = [];

    if (pol_id) {
      params.push(pol_id);
      query += ` AND vr.pol_id = $${params.length}`;
    }
    if (pod_id) {
      params.push(pod_id);
      query += ` AND vr.pod_id = $${params.length}`;
    }
    if (container_type) {
      params.push(container_type);
      query += ` AND vr.container_type = $${params.length}`;
    }
    if (valid_date) {
      params.push(valid_date);
      query += ` AND $${params.length}::date BETWEEN vr.valid_from AND vr.valid_to`;
    } else {
      query += ' AND CURRENT_DATE BETWEEN vr.valid_from AND vr.valid_to';
    }

    query += ' ORDER BY vr.rate_usd';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendor rates:', error);
    res.status(500).json({ error: 'Failed to fetch vendor rates' });
  }
});

// =============================================
// INQUIRIES ENDPOINTS
// =============================================

app.get('/api/inquiries', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = `
      SELECT i.*, c.name as customer_name_joined, c.code as customer_code
      FROM inquiries i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }
    query += ' ORDER BY i.created_at DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// =============================================
// QUOTATIONS ENDPOINTS
// =============================================

app.get('/api/quotations', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = `
      SELECT q.*, c.name as customer_name_joined,
             pol.code as pol_code, pol.name as pol_name,
             pod.code as pod_code, pod.name as pod_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN ports pol ON q.pol_id = pol.id
      LEFT JOIN ports pod ON q.pod_id = pod.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND q.status = $${params.length}`;
    }
    query += ' ORDER BY q.created_at DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// =============================================
// SHIPMENTS ENDPOINTS
// =============================================

app.get('/api/shipments', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name_joined, c.code as customer_code,
             v.name as vendor_name, ca.name as carrier_name,
             pol.code as pol_code, pol.name as pol_name,
             pod.code as pod_code, pod.name as pod_name
      FROM shipments s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN carriers ca ON s.carrier_id = ca.id
      LEFT JOIN ports pol ON s.pol_id = pol.id
      LEFT JOIN ports pod ON s.pod_id = pod.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    query += ' ORDER BY s.created_at DESC';

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);

    // Map joined port data
    const shipments = result.rows.map(s => ({
      ...s,
      pol: s.pol_code ? { code: s.pol_code, name: s.pol_name } : null,
      pod: s.pod_code ? { code: s.pod_code, name: s.pod_name } : null,
    }));

    res.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// =============================================
// REPORTS ENDPOINTS
// =============================================

app.get('/api/reports/monthly-profit', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = 'SELECT * FROM v_monthly_profit';

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching monthly profit:', error);
    res.status(500).json({ error: 'Failed to fetch monthly profit' });
  }
});

app.get('/api/reports/customer-profit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_customer_profit');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer profit:', error);
    res.status(500).json({ error: 'Failed to fetch customer profit' });
  }
});

app.get('/api/reports/route-profit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_route_profit');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching route profit:', error);
    res.status(500).json({ error: 'Failed to fetch route profit' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Freight Tracker API running on http://localhost:${PORT}`);
});
