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
