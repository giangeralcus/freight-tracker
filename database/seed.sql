-- =============================================
-- FREIGHT TRACKER SEED DATA
-- PT Gateway Prima Indonusa
-- =============================================

-- =============================================
-- SETTINGS
-- =============================================
INSERT INTO settings (key, value, description) VALUES
('exchange_rate_usd_idr', '15800', 'USD to IDR exchange rate'),
('default_markup_percent', '15', 'Default markup percentage for quotations'),
('vat_rate_percent', '11', 'VAT rate for Indonesia'),
('company_name', 'PT Gateway Prima Indonusa', 'Company name'),
('company_address', 'Taman Palem Lestari Blok A11 No. 3-B, Jakarta Barat', 'Company address'),
('company_phone', '+6221 55960533', 'Company phone'),
('company_email', 'agency@gpindo.co.id', 'Company email');

-- =============================================
-- PORTS (UN/LOCODE format)
-- =============================================
INSERT INTO ports (code, name, city, country, country_code, port_type, region) VALUES
-- Indonesia
('IDJKT', 'Tanjung Priok', 'Jakarta', 'Indonesia', 'ID', 'SEA', 'Southeast Asia'),
('IDSBY', 'Tanjung Perak', 'Surabaya', 'Indonesia', 'ID', 'SEA', 'Southeast Asia'),
('IDSMG', 'Tanjung Mas', 'Semarang', 'Indonesia', 'ID', 'SEA', 'Southeast Asia'),
('IDBLW', 'Belawan', 'Medan', 'Indonesia', 'ID', 'SEA', 'Southeast Asia'),
('IDCGK', 'Soekarno-Hatta', 'Jakarta', 'Indonesia', 'ID', 'AIR', 'Southeast Asia'),

-- Australia
('AUBNE', 'Brisbane', 'Brisbane', 'Australia', 'AU', 'SEA', 'Oceania'),
('AUSYD', 'Sydney', 'Sydney', 'Australia', 'AU', 'SEA', 'Oceania'),
('AUMEL', 'Melbourne', 'Melbourne', 'Australia', 'AU', 'SEA', 'Oceania'),
('AUFRE', 'Fremantle', 'Perth', 'Australia', 'AU', 'SEA', 'Oceania'),
('AUADL', 'Adelaide', 'Adelaide', 'Australia', 'AU', 'SEA', 'Oceania'),

-- USA
('USLAX', 'Los Angeles', 'Los Angeles', 'USA', 'US', 'SEA', 'North America'),
('USLGB', 'Long Beach', 'Long Beach', 'USA', 'US', 'SEA', 'North America'),
('USNYC', 'New York/New Jersey', 'New York', 'USA', 'US', 'SEA', 'North America'),
('USOAK', 'Oakland', 'Oakland', 'USA', 'US', 'SEA', 'North America'),
('USSEA', 'Seattle', 'Seattle', 'USA', 'US', 'SEA', 'North America'),
('USJFK', 'JFK Airport', 'New York', 'USA', 'US', 'AIR', 'North America'),

-- Canada
('CAYYZ', 'Toronto', 'Toronto', 'Canada', 'CA', 'BOTH', 'North America'),
('CAVAN', 'Vancouver', 'Vancouver', 'Canada', 'CA', 'SEA', 'North America'),
('CAMTR', 'Montreal', 'Montreal', 'Canada', 'CA', 'SEA', 'North America'),

-- Europe
('NLRTM', 'Rotterdam', 'Rotterdam', 'Netherlands', 'NL', 'SEA', 'Europe'),
('DEHAM', 'Hamburg', 'Hamburg', 'Germany', 'DE', 'SEA', 'Europe'),
('GBFXT', 'Felixstowe', 'Felixstowe', 'UK', 'GB', 'SEA', 'Europe'),
('FRLEH', 'Le Havre', 'Le Havre', 'France', 'FR', 'SEA', 'Europe'),
('BEANR', 'Antwerp', 'Antwerp', 'Belgium', 'BE', 'SEA', 'Europe'),

-- Asia
('SGSIN', 'Singapore', 'Singapore', 'Singapore', 'SG', 'BOTH', 'Southeast Asia'),
('MYPKG', 'Port Klang', 'Port Klang', 'Malaysia', 'MY', 'SEA', 'Southeast Asia'),
('HKHKG', 'Hong Kong', 'Hong Kong', 'Hong Kong', 'HK', 'BOTH', 'East Asia'),
('CNSHA', 'Shanghai', 'Shanghai', 'China', 'CN', 'SEA', 'East Asia'),
('CNYTN', 'Yantian', 'Shenzhen', 'China', 'CN', 'SEA', 'East Asia'),
('KRPUS', 'Busan', 'Busan', 'South Korea', 'KR', 'SEA', 'East Asia'),
('JPYOK', 'Yokohama', 'Yokohama', 'Japan', 'JP', 'SEA', 'East Asia'),
('THLCH', 'Laem Chabang', 'Chonburi', 'Thailand', 'TH', 'SEA', 'Southeast Asia'),
('AEJEA', 'Jebel Ali', 'Dubai', 'UAE', 'AE', 'SEA', 'Middle East'),
('INDEL', 'Delhi', 'Delhi', 'India', 'IN', 'AIR', 'South Asia'),
('INBOM', 'Nhava Sheva', 'Mumbai', 'India', 'IN', 'SEA', 'South Asia');

-- =============================================
-- CARRIERS - SHIPPING LINES
-- =============================================
INSERT INTO carriers (code, name, carrier_type, scac_code, website, tracking_url) VALUES
-- Major Shipping Lines
('MSK', 'Maersk Line', 'SHIPPING_LINE', 'MAEU', 'https://www.maersk.com', 'https://www.maersk.com/tracking'),
('CMA', 'CMA CGM', 'SHIPPING_LINE', 'CMDU', 'https://www.cma-cgm.com', 'https://www.cma-cgm.com/ebusiness/tracking'),
('OOCL', 'OOCL', 'SHIPPING_LINE', 'OOLU', 'https://www.oocl.com', 'https://www.oocl.com/eng/ourservices/eservices/cargotracking'),
('ONE', 'Ocean Network Express', 'SHIPPING_LINE', 'ONEY', 'https://www.one-line.com', 'https://ecomm.one-line.com/one-ecom/cargoTracking'),
('COSCO', 'COSCO Shipping', 'SHIPPING_LINE', 'COSU', 'https://www.cosco-shipping.com', 'https://elines.coscoshipping.com/ebusiness/cargoTracking'),
('MSC', 'MSC', 'SHIPPING_LINE', 'MSCU', 'https://www.msc.com', 'https://www.msc.com/track-a-shipment'),
('EVG', 'Evergreen Line', 'SHIPPING_LINE', 'EGLV', 'https://www.evergreen-line.com', 'https://www.evergreen-line.com/eService/cargo_tracking'),
('HMM', 'HMM (Hyundai)', 'SHIPPING_LINE', 'HDMU', 'https://www.hmm21.com', 'https://www.hmm21.com/cms/business/ebiz/trackTrace'),
('YML', 'Yang Ming Line', 'SHIPPING_LINE', 'YMLU', 'https://www.yangming.com', 'https://www.yangming.com/e-service/track-and-trace'),
('HPL', 'Hapag-Lloyd', 'SHIPPING_LINE', 'HLCU', 'https://www.hapag-lloyd.com', 'https://www.hapag-lloyd.com/en/online-business/track'),
('PIL', 'Pacific International Lines', 'SHIPPING_LINE', 'PILU', 'https://www.pilship.com', 'https://www.pilship.com/our-e-services/track-trace'),
('WHL', 'Wan Hai Lines', 'SHIPPING_LINE', 'WHLC', 'https://www.wanhai.com', 'https://www.wanhai.com/views/cargoTrack/CargoTrack.xhtml'),
('ZIM', 'ZIM', 'SHIPPING_LINE', 'ZIMU', 'https://www.zim.com', 'https://www.zim.com/tools/track-a-shipment'),
('RCL', 'RCL Feeder', 'SHIPPING_LINE', 'RCLC', 'https://www.rclgroup.com', 'https://www.rclgroup.com/track'),
('SEALAND', 'Sealand', 'SHIPPING_LINE', 'SEAU', 'https://www.sealandmaersk.com', 'https://www.sealandmaersk.com/tracking'),
('APL', 'APL', 'SHIPPING_LINE', 'APLU', 'https://www.apl.com', 'https://www.apl.com/ebusiness/tracking'),
('LINK', 'Link Logistics', 'SHIPPING_LINE', NULL, NULL, NULL),
('MCC', 'MCC Transport', 'SHIPPING_LINE', 'MCPU', 'https://www.mcc.com.sg', NULL),
('TSL', 'T.S. Lines', 'SHIPPING_LINE', 'TSLH', 'https://www.tslines.com', NULL),
('IAL', 'Interasia Lines', 'SHIPPING_LINE', 'IALU', 'https://www.interasia.cc', NULL);

-- =============================================
-- CARRIERS - AIRLINES
-- =============================================
INSERT INTO carriers (code, name, carrier_type, iata_code, website, tracking_url) VALUES
('GA', 'Garuda Indonesia', 'AIRLINE', 'GA', 'https://www.garuda-indonesia.com', NULL),
('SQ', 'Singapore Airlines Cargo', 'AIRLINE', 'SQ', 'https://www.siacargo.com', 'https://www.siacargo.com/tracking'),
('EK', 'Emirates SkyCargo', 'AIRLINE', 'EK', 'https://www.skycargo.com', 'https://www.skycargo.com/track'),
('CX', 'Cathay Pacific Cargo', 'AIRLINE', 'CX', 'https://www.cathaycargo.com', 'https://www.cathaycargo.com/en-us/cargo-tracking'),
('QR', 'Qatar Airways Cargo', 'AIRLINE', 'QR', 'https://www.qrcargo.com', 'https://www.qrcargo.com/track'),
('TK', 'Turkish Airlines Cargo', 'AIRLINE', 'TK', 'https://www.turkishcargo.com', NULL),
('KE', 'Korean Air Cargo', 'AIRLINE', 'KE', 'https://cargo.koreanair.com', NULL),
('MH', 'MASkargo', 'AIRLINE', 'MH', 'https://www.maskargo.com', NULL),
('TG', 'Thai Cargo', 'AIRLINE', 'TG', 'https://www.thaicargo.com', NULL),
('PR', 'Philippine Airlines Cargo', 'AIRLINE', 'PR', 'https://www.palcargo.com', NULL);

-- =============================================
-- SAMPLE VENDORS (COLOADERS)
-- =============================================
INSERT INTO vendors (code, name, vendor_type, city, country, email, payment_terms) VALUES
('V001', 'Link Pasifik Indonusa', 'COLOADER', 'Jakarta', 'Indonesia', 'ops@linkpasifik.com', 30),
('V002', 'NTL Naigai Trans Line', 'COLOADER', 'Jakarta', 'Indonesia', 'jakarta@ntlnaigai.com', 30),
('V003', 'Bina Global Logistic', 'COLOADER', 'Jakarta', 'Indonesia', 'rate@binaglobal.com', 30),
('V004', 'SSL Cargo', 'COLOADER', 'Jakarta', 'Indonesia', 'ops@sslcargo.com', 30),
('V005', 'Multifreight Logistics', 'COLOADER', 'Jakarta', 'Indonesia', 'pricing@multifreight.com', 30);

-- =============================================
-- SAMPLE CUSTOMERS
-- =============================================
INSERT INTO customers (code, name, city, country, email, contact_person, payment_terms, credit_limit) VALUES
('C001', 'ABC Export Import Pty Ltd', 'Sydney', 'Australia', 'shipping@abcexport.com.au', 'John Smith', 30, 50000),
('C002', 'XYZ Trading Co', 'Melbourne', 'Australia', 'logistics@xyztrading.com.au', 'Sarah Johnson', 45, 75000),
('C003', 'US Imports LLC', 'Los Angeles', 'USA', 'imports@usimports.com', 'Mike Brown', 30, 100000),
('C004', 'Canada Freight Inc', 'Toronto', 'Canada', 'ops@canadafreight.ca', 'Emily Davis', 60, 80000),
('C005', 'Euro Distribution GmbH', 'Hamburg', 'Germany', 'shipping@eurodist.de', 'Hans Mueller', 45, 60000);

-- =============================================
-- SAMPLE VENDOR RATES (Sea FCL)
-- =============================================
INSERT INTO vendor_rates_sea (vendor_id, carrier_id, pol_id, pod_id, container_type, rate_usd, transit_days, free_time_days, valid_from, valid_to) VALUES
-- Jakarta to Australia (via Link Pasifik)
((SELECT id FROM vendors WHERE code = 'V001'),
 (SELECT id FROM carriers WHERE code = 'MSK'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'AUBNE'),
 '20GP', 850, 14, 14, '2025-01-01', '2025-03-31'),

((SELECT id FROM vendors WHERE code = 'V001'),
 (SELECT id FROM carriers WHERE code = 'MSK'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'AUBNE'),
 '40GP', 1200, 14, 14, '2025-01-01', '2025-03-31'),

((SELECT id FROM vendors WHERE code = 'V001'),
 (SELECT id FROM carriers WHERE code = 'MSK'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'AUBNE'),
 '40HC', 1250, 14, 14, '2025-01-01', '2025-03-31'),

-- Jakarta to USA West Coast
((SELECT id FROM vendors WHERE code = 'V002'),
 (SELECT id FROM carriers WHERE code = 'ONE'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'USLAX'),
 '20GP', 1800, 21, 14, '2025-01-01', '2025-03-31'),

((SELECT id FROM vendors WHERE code = 'V002'),
 (SELECT id FROM carriers WHERE code = 'ONE'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'USLAX'),
 '40HC', 2800, 21, 14, '2025-01-01', '2025-03-31'),

-- Jakarta to Canada
((SELECT id FROM vendors WHERE code = 'V003'),
 (SELECT id FROM carriers WHERE code = 'CMA'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'CAVAN'),
 '40HC', 3200, 28, 14, '2025-01-01', '2025-03-31'),

-- Jakarta to Europe
((SELECT id FROM vendors WHERE code = 'V004'),
 (SELECT id FROM carriers WHERE code = 'MSC'),
 (SELECT id FROM ports WHERE code = 'IDJKT'),
 (SELECT id FROM ports WHERE code = 'NLRTM'),
 '40HC', 2400, 28, 14, '2025-01-01', '2025-03-31');

-- =============================================
-- SAMPLE VENDOR SURCHARGES
-- =============================================
INSERT INTO vendor_surcharges (vendor_id, charge_code, charge_name, charge_type, amount, currency, unit, valid_from, valid_to) VALUES
-- Origin Charges (Jakarta)
((SELECT id FROM vendors WHERE code = 'V001'), 'THC-O', 'Terminal Handling Charge - Origin', 'ORIGIN', 150, 'USD', 'PER_CONTAINER', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V001'), 'DOC', 'Documentation Fee', 'ORIGIN', 50, 'USD', 'PER_BL', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V001'), 'SEAL', 'Seal Fee', 'ORIGIN', 15, 'USD', 'PER_CONTAINER', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V001'), 'LSS', 'Low Sulphur Surcharge', 'FREIGHT', 100, 'USD', 'PER_CONTAINER', '2025-01-01', '2025-12-31'),

-- Destination Charges (Australia)
((SELECT id FROM vendors WHERE code = 'V001'), 'THC-D', 'Terminal Handling Charge - Destination', 'DESTINATION', 280, 'USD', 'PER_CONTAINER', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V001'), 'DO', 'Delivery Order Fee', 'DESTINATION', 75, 'USD', 'PER_BL', '2025-01-01', '2025-12-31'),

-- USA-specific charges
((SELECT id FROM vendors WHERE code = 'V002'), 'AMS', 'AMS Filing Fee', 'DESTINATION', 35, 'USD', 'PER_BL', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V002'), 'ISF', 'ISF Filing Fee', 'DESTINATION', 50, 'USD', 'PER_BL', '2025-01-01', '2025-12-31'),
((SELECT id FROM vendors WHERE code = 'V002'), 'THC-D', 'Terminal Handling Charge - Destination', 'DESTINATION', 400, 'USD', 'PER_CONTAINER', '2025-01-01', '2025-12-31');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Freight Tracker seed data loaded successfully!' AS message;
