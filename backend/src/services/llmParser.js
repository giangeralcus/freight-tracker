/**
 * LLM-based Email Parser for Freight Inquiries
 * Uses Qwen2.5 via Ollama to extract structured data from customer emails
 */
import ollama from 'ollama';

// Default model
const DEFAULT_MODEL = 'qwen2.5:7b';

// Prompt for parsing freight inquiry emails
const INQUIRY_PARSE_PROMPT = `Extract freight inquiry details from this customer email. Return JSON only.

EMAIL:
{email_content}

EXTRACT THESE FIELDS (use null if not found):
- customer_name: Customer/company name
- customer_email: Email address
- incoterm: Shipping term (FOB, CIF, CFR, EXW, DDP, etc.)
- service_type: FCL, LCL, or AIR
- pol: Port of Loading (city or port name)
- pod: Port of Discharge / Destination (city or port name)
- commodity: Cargo description
- is_dg: Is dangerous goods? (true/false)
- dg_class: DG class if applicable
- weight_kg: Weight in KG (number only)
- volume_cbm: Volume in CBM (number only)
- container_type: 20GP, 40GP, 40HC, etc.
- container_qty: Number of containers (number only)
- required_date: When shipment is needed
- special_requirements: Any special notes

RULES:
- POL/POD: Extract city names, convert to uppercase (e.g., "jakarta" -> "JAKARTA")
- Service type: Default to FCL if containers mentioned, LCL if CBM mentioned, AIR if urgent/flight
- Weight: Convert to KG if in MT (multiply by 1000)
- Return valid JSON object only, no explanation

JSON:`;

/**
 * Check if Ollama is available
 */
async function isOllamaAvailable() {
  try {
    const models = await ollama.list();
    const modelNames = models.models.map(m => m.name);
    return modelNames.some(name => name.includes('qwen2.5') || name.includes('qwen2'));
  } catch (error) {
    console.error('Ollama not available:', error.message);
    return false;
  }
}

/**
 * Parse JSON from LLM response
 */
function parseJsonResponse(response) {
  // Handle markdown code blocks
  let text = response;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    text = jsonMatch[1];
  }

  // Find JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    text = objMatch[0];
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', error.message);
    return null;
  }
}

/**
 * Parse a freight inquiry email using LLM
 * @param {string} emailContent - Email subject + body
 * @param {string} model - Ollama model to use
 * @returns {Object} Parsed inquiry data
 */
export async function parseInquiryEmail(emailContent, model = DEFAULT_MODEL) {
  const available = await isOllamaAvailable();
  if (!available) {
    throw new Error('Ollama not available. Make sure Ollama is running and qwen2.5:7b is pulled.');
  }

  const prompt = INQUIRY_PARSE_PROMPT.replace('{email_content}', emailContent);

  try {
    console.log(`Parsing email with ${model}...`);

    const response = await ollama.chat({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: 0.1,
        num_predict: 1024,
      }
    });

    const responseText = response.message.content.trim();
    const parsed = parseJsonResponse(responseText);

    if (!parsed) {
      throw new Error('Failed to parse LLM response');
    }

    // Clean and validate the parsed data
    return cleanParsedData(parsed);

  } catch (error) {
    console.error('Email parsing failed:', error.message);
    throw error;
  }
}

/**
 * Clean and normalize parsed data
 */
function cleanParsedData(data) {
  return {
    customer_name: cleanString(data.customer_name),
    customer_email: cleanString(data.customer_email)?.toLowerCase(),
    incoterm: cleanString(data.incoterm)?.toUpperCase(),
    service_type: normalizeServiceType(data.service_type),
    pol: cleanString(data.pol)?.toUpperCase(),
    pod: cleanString(data.pod)?.toUpperCase(),
    commodity: cleanString(data.commodity),
    is_dg: Boolean(data.is_dg),
    dg_class: cleanString(data.dg_class),
    weight_kg: parseNumber(data.weight_kg),
    volume_cbm: parseNumber(data.volume_cbm),
    container_type: normalizeContainerType(data.container_type),
    container_qty: parseInt(data.container_qty) || null,
    required_date: cleanString(data.required_date),
    special_requirements: cleanString(data.special_requirements),
    confidence: 0.85, // LLM parsing confidence
  };
}

function cleanString(value) {
  if (!value || value === 'null' || value === 'undefined') return null;
  return String(value).trim();
}

function parseNumber(value) {
  if (!value) return null;
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

function normalizeServiceType(value) {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper.includes('FCL') || upper.includes('CONTAINER')) return 'FCL';
  if (upper.includes('LCL') || upper.includes('CONSOL')) return 'LCL';
  if (upper.includes('AIR')) return 'AIR';
  return upper;
}

function normalizeContainerType(value) {
  if (!value) return null;
  const upper = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Normalize common variations
  const types = {
    '20GP': ['20GP', '20', '20FT', '20DRY', '1X20'],
    '40GP': ['40GP', '40', '40FT', '40DRY', '1X40'],
    '40HC': ['40HC', '40HQ', '40HIGH', '40HIGHCUBE'],
    '45HC': ['45HC', '45HQ'],
    '20RF': ['20RF', '20REEFER'],
    '40RF': ['40RF', '40REEFER'],
  };

  for (const [normalized, variants] of Object.entries(types)) {
    if (variants.some(v => upper.includes(v))) {
      return normalized;
    }
  }
  return upper;
}

/**
 * Match POL/POD to port database
 * @param {Object} pool - Database pool
 * @param {string} portName - Port name to search
 * @returns {Object|null} Matched port
 */
export async function matchPort(pool, portName) {
  if (!portName) return null;

  try {
    // Try exact code match first
    let result = await pool.query(
      'SELECT id, code, name, country FROM ports WHERE UPPER(code) = $1 AND is_active = true',
      [portName.toUpperCase()]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Try name match
    result = await pool.query(
      `SELECT id, code, name, country FROM ports
       WHERE (UPPER(name) LIKE $1 OR UPPER(city) LIKE $1) AND is_active = true
       ORDER BY name LIMIT 1`,
      [`%${portName.toUpperCase()}%`]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Port matching failed:', error.message);
    return null;
  }
}

/**
 * Match customer by email or name
 * @param {Object} pool - Database pool
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Object|null} Matched customer
 */
export async function matchCustomer(pool, email, name) {
  try {
    // Try email match first
    if (email) {
      const result = await pool.query(
        'SELECT id, code, name, email FROM customers WHERE LOWER(email) = $1 AND is_active = true',
        [email.toLowerCase()]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    }

    // Try name match
    if (name) {
      const result = await pool.query(
        `SELECT id, code, name, email FROM customers
         WHERE UPPER(name) LIKE $1 AND is_active = true
         ORDER BY name LIMIT 1`,
        [`%${name.toUpperCase()}%`]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    }

    return null;
  } catch (error) {
    console.error('Customer matching failed:', error.message);
    return null;
  }
}

export default {
  parseInquiryEmail,
  matchPort,
  matchCustomer,
  isOllamaAvailable,
};
