// =============================================
// FREIGHT TRACKER TYPES
// =============================================

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  payment_terms: number;
  credit_limit: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: number;
  code: string;
  name: string;
  vendor_type: 'COLOADER' | 'SHIPPING_LINE' | 'AIRLINE' | 'TRUCKING' | 'WAREHOUSE';
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  payment_terms: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Port {
  id: number;
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  port_type: 'SEA' | 'AIR' | 'BOTH';
  region: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Carrier {
  id: number;
  code: string;
  name: string;
  carrier_type: 'SHIPPING_LINE' | 'AIRLINE';
  scac_code: string | null;
  iata_code: string | null;
  website: string | null;
  tracking_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VendorRateSea {
  id: number;
  vendor_id: number;
  carrier_id: number | null;
  pol_id: number;
  pod_id: number;
  container_type: '20GP' | '40GP' | '40HC' | '45HC' | '20RF' | '40RF';
  rate_usd: number;
  transit_days: number | null;
  free_time_days: number;
  valid_from: string;
  valid_to: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  vendor?: Vendor;
  carrier?: Carrier;
  pol?: Port;
  pod?: Port;
}

export interface VendorSurcharge {
  id: number;
  vendor_id: number;
  charge_code: string;
  charge_name: string;
  charge_type: 'ORIGIN' | 'DESTINATION' | 'FREIGHT';
  amount: number;
  currency: string;
  unit: 'PER_CONTAINER' | 'PER_BL' | 'PER_CBM' | 'PER_KG' | 'LUMPSUM';
  pol_id: number | null;
  pod_id: number | null;
  valid_from: string | null;
  valid_to: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export type InquiryStatus = 'NEW' | 'QUOTED' | 'WON' | 'LOST' | 'CANCELLED';
export type ServiceType = 'FCL' | 'LCL' | 'AIR';

export interface Inquiry {
  id: number;
  inquiry_number: string;
  inquiry_date: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_email: string | null;
  incoterm: string | null;
  service_type: ServiceType | null;
  pol: string | null;
  pol_id: number | null;
  pod: string | null;
  pod_id: number | null;
  commodity: string | null;
  is_dg: boolean;
  dg_class: string | null;
  un_number: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  container_type: string | null;
  container_qty: number | null;
  freetime_days: number | null;
  reference_bl: string | null;
  status: InquiryStatus;
  email_subject: string | null;
  email_body: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: Customer;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Quotation {
  id: number;
  quote_number: string;
  quote_date: string;
  valid_until: string | null;
  inquiry_id: number | null;
  customer_id: number | null;
  customer_name: string;
  incoterm: string | null;
  service_type: ServiceType | null;
  pol_id: number | null;
  pod_id: number | null;
  commodity: string | null;
  is_dg: boolean;
  dg_class: string | null;
  container_type: string | null;
  container_qty: number;
  weight_kg: number | null;
  volume_cbm: number | null;
  total_cost_usd: number;
  total_revenue_usd: number;
  profit_usd: number;
  profit_margin: number;
  exchange_rate: number | null;
  total_cost_idr: number | null;
  total_revenue_idr: number | null;
  profit_idr: number | null;
  status: QuotationStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: Customer;
  inquiry?: Inquiry;
  pol?: Port;
  pod?: Port;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  charge_code: string;
  charge_name: string;
  charge_type: 'ORIGIN' | 'FREIGHT' | 'DESTINATION';
  vendor_id: number | null;
  cost_amount: number;
  cost_currency: string;
  sell_amount: number;
  sell_currency: string;
  unit: string;
  quantity: number;
  total_cost: number;
  total_sell: number;
  profit: number;
  sort_order: number;
  notes: string | null;
  created_at: string;
  // Joined
  vendor?: Vendor;
}

export type ShipmentStatus = 'BOOKED' | 'SHIPPED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'INVOICED' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface Shipment {
  id: number;
  job_number: string;
  booking_date: string;
  quotation_id: number | null;
  customer_id: number | null;
  customer_name: string;
  vendor_id: number | null;
  carrier_id: number | null;
  incoterm: string | null;
  service_type: ServiceType | null;
  pol_id: number | null;
  pod_id: number | null;
  vessel_name: string | null;
  voyage_number: string | null;
  etd: string | null;
  eta: string | null;
  commodity: string | null;
  is_dg: boolean;
  container_type: string | null;
  container_qty: number;
  bl_number: string | null;
  quoted_cost_usd: number;
  quoted_revenue_usd: number;
  quoted_profit_usd: number;
  actual_cost_usd: number;
  actual_revenue_usd: number;
  actual_profit_usd: number;
  exchange_rate: number | null;
  actual_profit_idr: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  payment_due_date: string | null;
  payment_received_date: string | null;
  payment_status: PaymentStatus;
  status: ShipmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: Customer;
  vendor?: Vendor;
  carrier?: Carrier;
  quotation?: Quotation;
  pol?: Port;
  pod?: Port;
  items?: ShipmentItem[];
}

export interface ShipmentItem {
  id: number;
  shipment_id: number;
  charge_code: string;
  charge_name: string;
  charge_type: string;
  vendor_id: number | null;
  cost_amount: number;
  cost_currency: string;
  sell_amount: number;
  sell_currency: string;
  quantity: number;
  total_cost: number;
  total_sell: number;
  profit: number;
  vendor_invoice_no: string | null;
  vendor_invoice_date: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  vendor?: Vendor;
}

// Dashboard Summary
export interface DashboardSummary {
  active_shipments: number;
  pending_inquiries: number;
  active_quotes: number;
  overdue_payments: number;
  mtd_profit_usd: number;
  ytd_profit_usd: number;
}

// Monthly Profit View
export interface MonthlyProfit {
  month: string;
  shipment_count: number;
  total_revenue_usd: number;
  total_cost_usd: number;
  total_profit_usd: number;
  margin_percentage: number;
}

// Customer Profit View
export interface CustomerProfit {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  shipment_count: number;
  total_revenue_usd: number;
  total_cost_usd: number;
  total_profit_usd: number;
  margin_percentage: number;
  last_shipment_date: string | null;
}

// Route Profit View
export interface RouteProfit {
  pol_code: string;
  pol_name: string;
  pod_code: string;
  pod_name: string;
  service_type: string;
  shipment_count: number;
  total_revenue_usd: number;
  total_cost_usd: number;
  total_profit_usd: number;
  margin_percentage: number;
}

// =============================================
// MULTI-CURRENCY TYPES
// =============================================

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
  decimal_places: number;
  country: string | null;
  is_base: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type RateSource = 'BI' | 'BCA' | 'MANDIRI' | 'MANUAL' | 'API';

export interface ExchangeRate {
  id: number;
  from_currency: string;
  from_currency_name: string;
  to_currency: string;
  to_currency_name: string;
  rate: number;
  rate_buy: number | null;
  rate_sell: number | null;
  source: RateSource;
  source_reference: string | null;
  week_number: number;
  year: number;
  valid_from: string;
  valid_to: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRateHistory extends ExchangeRate {
  prev_rate: number | null;
  change_percent: number | null;
}

export interface ConversionResult {
  original_amount: number;
  from_currency: string;
  converted_amount: number;
  to_currency: string;
  rate_used: number;
  source: RateSource;
  date: string;
}

export interface RateInput {
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_buy?: number;
  rate_sell?: number;
  source_reference?: string;
  notes?: string;
}
