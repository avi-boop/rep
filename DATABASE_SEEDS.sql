-- Database Seed Script for Mobile Repair Dashboard
-- Run this after creating the database schema

-- ============================================
-- 1. BRANDS
-- ============================================

INSERT INTO brands (name, is_primary, created_at) VALUES
('Apple', true, NOW()),
('Samsung', true, NOW()),
('Google', false, NOW()),
('OnePlus', false, NOW()),
('Motorola', false, NOW()),
('LG', false, NOW()),
('Huawei', false, NOW()),
('Xiaomi', false, NOW());

-- ============================================
-- 2. DEVICE MODELS - iPhone
-- ============================================

-- Get Apple brand ID
WITH apple_brand AS (
    SELECT id FROM brands WHERE name = 'Apple' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    apple_brand.id,
    'iPhone 15',
    variant,
    2023,
    9,
    tier,
    true,
    false,
    NOW()
FROM apple_brand
CROSS JOIN (
    VALUES 
        ('Pro Max', 1),
        ('Pro', 1),
        ('Plus', 2),
        ('Standard', 2)
) AS variants(variant, tier);

WITH apple_brand AS (
    SELECT id FROM brands WHERE name = 'Apple' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    apple_brand.id,
    'iPhone 14',
    variant,
    2022,
    9,
    tier,
    true,
    false,
    NOW()
FROM apple_brand
CROSS JOIN (
    VALUES 
        ('Pro Max', 1),
        ('Pro', 1),
        ('Plus', 2),
        ('Standard', 2)
) AS variants(variant, tier);

WITH apple_brand AS (
    SELECT id FROM brands WHERE name = 'Apple' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    apple_brand.id,
    'iPhone 13',
    variant,
    2021,
    9,
    tier,
    true,
    false,
    NOW()
FROM apple_brand
CROSS JOIN (
    VALUES 
        ('Pro Max', 1),
        ('Pro', 1),
        ('Mini', 3),
        ('Standard', 2)
) AS variants(variant, tier);

WITH apple_brand AS (
    SELECT id FROM brands WHERE name = 'Apple' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    apple_brand.id,
    model,
    variant,
    year,
    month,
    tier,
    true,
    false,
    NOW()
FROM apple_brand
CROSS JOIN (
    VALUES 
        ('iPhone 12', 'Pro Max', 2020, 10, 1),
        ('iPhone 12', 'Pro', 2020, 10, 1),
        ('iPhone 12', 'Mini', 2020, 10, 3),
        ('iPhone 12', 'Standard', 2020, 10, 2),
        ('iPhone 11', 'Pro Max', 2019, 9, 1),
        ('iPhone 11', 'Pro', 2019, 9, 1),
        ('iPhone 11', 'Standard', 2019, 9, 2),
        ('iPhone SE', '3rd Gen', 2022, 3, 3),
        ('iPhone SE', '2nd Gen', 2020, 4, 3),
        ('iPhone XR', NULL, 2018, 10, 2),
        ('iPhone XS', 'Max', 2018, 9, 1),
        ('iPhone XS', 'Standard', 2018, 9, 1),
        ('iPhone X', NULL, 2017, 11, 1)
) AS models(model, variant, year, month, tier);

-- iPad models
WITH apple_brand AS (
    SELECT id FROM brands WHERE name = 'Apple' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    apple_brand.id,
    model,
    variant,
    year,
    month,
    tier,
    false,
    true,
    NOW()
FROM apple_brand
CROSS JOIN (
    VALUES 
        ('iPad Pro', '12.9" (2023)', 2023, 5, 1),
        ('iPad Pro', '11" (2023)', 2023, 5, 1),
        ('iPad Air', '5th Gen', 2022, 3, 2),
        ('iPad', '10th Gen', 2022, 10, 2),
        ('iPad mini', '6th Gen', 2021, 9, 2)
) AS models(model, variant, year, month, tier);

-- ============================================
-- 3. DEVICE MODELS - Samsung
-- ============================================

WITH samsung_brand AS (
    SELECT id FROM brands WHERE name = 'Samsung' LIMIT 1
)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level, is_phone, is_tablet, created_at)
SELECT 
    samsung_brand.id,
    model,
    variant,
    year,
    month,
    tier,
    is_phone,
    is_tablet,
    NOW()
FROM samsung_brand
CROSS JOIN (
    VALUES 
        -- Galaxy S Series
        ('Galaxy S24', 'Ultra', 2024, 1, 1, true, false),
        ('Galaxy S24', 'Plus', 2024, 1, 2, true, false),
        ('Galaxy S24', 'Standard', 2024, 1, 2, true, false),
        ('Galaxy S23', 'Ultra', 2023, 2, 1, true, false),
        ('Galaxy S23', 'Plus', 2023, 2, 2, true, false),
        ('Galaxy S23', 'Standard', 2023, 2, 2, true, false),
        ('Galaxy S22', 'Ultra', 2022, 2, 1, true, false),
        ('Galaxy S22', 'Plus', 2022, 2, 2, true, false),
        ('Galaxy S22', 'Standard', 2022, 2, 2, true, false),
        ('Galaxy S21', 'Ultra', 2021, 1, 1, true, false),
        ('Galaxy S21', 'Plus', 2021, 1, 2, true, false),
        ('Galaxy S21', 'Standard', 2021, 1, 2, true, false),
        
        -- Galaxy A Series
        ('Galaxy A54', '5G', 2023, 3, 2, true, false),
        ('Galaxy A34', '5G', 2023, 3, 2, true, false),
        ('Galaxy A14', '5G', 2023, 1, 3, true, false),
        
        -- Galaxy Z Series (Foldables)
        ('Galaxy Z Fold', '5', 2023, 8, 1, true, false),
        ('Galaxy Z Flip', '5', 2023, 8, 1, true, false),
        ('Galaxy Z Fold', '4', 2022, 8, 1, true, false),
        ('Galaxy Z Flip', '4', 2022, 8, 1, true, false),
        
        -- Tablets
        ('Galaxy Tab S9', 'Ultra', 2023, 8, 1, false, true),
        ('Galaxy Tab S9', 'Plus', 2023, 8, 2, false, true),
        ('Galaxy Tab S9', 'Standard', 2023, 8, 2, false, true),
        ('Galaxy Tab A8', NULL, 2022, 1, 2, false, true)
) AS models(model, variant, year, month, tier, is_phone, is_tablet);

-- ============================================
-- 4. REPAIR TYPES
-- ============================================

INSERT INTO repair_types (name, category, complexity_level, avg_time_minutes, created_at) VALUES
-- Screen repairs
('Screen Replacement (LCD)', 'display', 3, 45, NOW()),
('Screen Replacement (OLED)', 'display', 4, 60, NOW()),
('Screen Glass Only', 'display', 5, 90, NOW()),
('Digitizer Replacement', 'display', 4, 60, NOW()),

-- Battery
('Battery Replacement', 'battery', 2, 30, NOW()),

-- Housing/Back
('Back Glass Replacement', 'housing', 4, 60, NOW()),
('Housing Replacement', 'housing', 5, 120, NOW()),
('Frame Replacement', 'housing', 5, 90, NOW()),

-- Audio
('Earpiece Speaker', 'audio', 3, 35, NOW()),
('Loud Speaker', 'audio', 3, 35, NOW()),
('Microphone', 'audio', 3, 40, NOW()),

-- Charging/Power
('Charging Port', 'port', 3, 45, NOW()),
('Wireless Charging Coil', 'port', 4, 50, NOW()),
('Power Button', 'button', 3, 40, NOW()),
('Volume Button', 'button', 3, 40, NOW()),

-- Camera
('Rear Camera', 'camera', 3, 40, NOW()),
('Front Camera', 'camera', 3, 35, NOW()),
('Camera Lens Glass', 'camera', 2, 20, NOW()),

-- Connectivity
('Wi-Fi Antenna', 'connectivity', 4, 45, NOW()),
('Bluetooth Antenna', 'connectivity', 4, 45, NOW()),
('Signal Antenna', 'connectivity', 4, 50, NOW()),

-- Advanced
('Motherboard Repair', 'motherboard', 5, 180, NOW()),
('Water Damage Treatment', 'repair', 4, 120, NOW()),
('Data Recovery', 'software', 3, 90, NOW()),
('Software Restore', 'software', 1, 30, NOW()),
('Face ID Repair', 'sensor', 5, 90, NOW()),
('Touch ID Repair', 'sensor', 4, 60, NOW());

-- ============================================
-- 5. SAMPLE PRICES - iPhone Screen Repairs
-- ============================================

-- Get iPhone model IDs
WITH iphone_models AS (
    SELECT dm.id, dm.name, dm.variant, b.name as brand_name
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Apple' AND dm.is_phone = true
),
screen_repair AS (
    SELECT id FROM repair_types WHERE name = 'Screen Replacement (OLED)' LIMIT 1
)
INSERT INTO prices (device_model_id, repair_type_id, parts_quality, parts_cost, labor_cost, total_price, is_estimated, confidence_score, last_updated)
SELECT 
    im.id,
    sr.id,
    'original'::parts_quality,
    CASE 
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro Max' THEN 250
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro' THEN 230
        WHEN im.name = 'iPhone 15' THEN 200
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro Max' THEN 230
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro' THEN 210
        WHEN im.name = 'iPhone 14' THEN 180
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro Max' THEN 210
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro' THEN 190
        WHEN im.name = 'iPhone 13' THEN 160
        WHEN im.name = 'iPhone 12' THEN 140
        WHEN im.name = 'iPhone 11' THEN 120
        WHEN im.name = 'iPhone SE' THEN 80
        ELSE 150
    END,
    50, -- labor cost
    CASE 
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro Max' THEN 329
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro' THEN 309
        WHEN im.name = 'iPhone 15' THEN 279
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro Max' THEN 309
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro' THEN 289
        WHEN im.name = 'iPhone 14' THEN 259
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro Max' THEN 289
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro' THEN 269
        WHEN im.name = 'iPhone 13' THEN 239
        WHEN im.name = 'iPhone 12' THEN 199
        WHEN im.name = 'iPhone 11' THEN 169
        WHEN im.name = 'iPhone SE' THEN 139
        ELSE 199
    END,
    false,
    1.0,
    NOW()
FROM iphone_models im
CROSS JOIN screen_repair sr
WHERE im.name IN ('iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE');

-- Aftermarket premium prices
WITH iphone_models AS (
    SELECT dm.id, dm.name, dm.variant
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Apple' AND dm.is_phone = true
),
screen_repair AS (
    SELECT id FROM repair_types WHERE name = 'Screen Replacement (OLED)' LIMIT 1
)
INSERT INTO prices (device_model_id, repair_type_id, parts_quality, parts_cost, labor_cost, total_price, is_estimated, confidence_score, last_updated)
SELECT 
    im.id,
    sr.id,
    'aftermarket_premium'::parts_quality,
    CASE 
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro Max' THEN 150
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro' THEN 140
        WHEN im.name = 'iPhone 15' THEN 120
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro Max' THEN 140
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro' THEN 130
        WHEN im.name = 'iPhone 14' THEN 110
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro Max' THEN 130
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro' THEN 120
        WHEN im.name = 'iPhone 13' THEN 100
        WHEN im.name = 'iPhone 11' THEN 70
        ELSE 100
    END,
    40,
    CASE 
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro Max' THEN 219
        WHEN im.name = 'iPhone 15' AND im.variant = 'Pro' THEN 209
        WHEN im.name = 'iPhone 15' THEN 189
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro Max' THEN 209
        WHEN im.name = 'iPhone 14' AND im.variant = 'Pro' THEN 199
        WHEN im.name = 'iPhone 14' THEN 179
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro Max' THEN 199
        WHEN im.name = 'iPhone 13' AND im.variant = 'Pro' THEN 189
        WHEN im.name = 'iPhone 13' THEN 169
        WHEN im.name = 'iPhone 11' THEN 129
        ELSE 149
    END,
    false,
    1.0,
    NOW()
FROM iphone_models im
CROSS JOIN screen_repair sr
WHERE im.name IN ('iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 11');

-- ============================================
-- 6. SAMPLE PRICES - iPhone Battery
-- ============================================

WITH iphone_models AS (
    SELECT dm.id, dm.name, dm.variant
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Apple' AND dm.is_phone = true
),
battery_repair AS (
    SELECT id FROM repair_types WHERE name = 'Battery Replacement' LIMIT 1
)
INSERT INTO prices (device_model_id, repair_type_id, parts_quality, parts_quality, parts_cost, labor_cost, total_price, is_estimated, confidence_score, last_updated)
SELECT 
    im.id,
    br.id,
    'original'::parts_quality,
    CASE 
        WHEN im.name LIKE 'iPhone 15%' THEN 60
        WHEN im.name LIKE 'iPhone 14%' THEN 55
        WHEN im.name LIKE 'iPhone 13%' THEN 50
        WHEN im.name LIKE 'iPhone 12%' THEN 45
        WHEN im.name LIKE 'iPhone 11%' THEN 40
        ELSE 40
    END,
    30,
    CASE 
        WHEN im.name LIKE 'iPhone 15%' THEN 99
        WHEN im.name LIKE 'iPhone 14%' THEN 89
        WHEN im.name LIKE 'iPhone 13%' THEN 79
        WHEN im.name LIKE 'iPhone 12%' THEN 69
        WHEN im.name LIKE 'iPhone 11%' THEN 59
        ELSE 59
    END,
    false,
    1.0,
    NOW()
FROM iphone_models im
CROSS JOIN battery_repair br
WHERE im.name LIKE 'iPhone%';

-- ============================================
-- 7. SAMPLE PRICES - Samsung Galaxy S Series
-- ============================================

WITH samsung_s_series AS (
    SELECT dm.id, dm.name, dm.variant
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Samsung' AND dm.name LIKE 'Galaxy S%'
),
screen_repair AS (
    SELECT id FROM repair_types WHERE name = 'Screen Replacement (OLED)' LIMIT 1
)
INSERT INTO prices (device_model_id, repair_type_id, parts_quality, parts_cost, labor_cost, total_price, is_estimated, confidence_score, last_updated)
SELECT 
    ss.id,
    sr.id,
    'original'::parts_quality,
    CASE 
        WHEN ss.name = 'Galaxy S24' AND ss.variant = 'Ultra' THEN 280
        WHEN ss.name = 'Galaxy S24' THEN 220
        WHEN ss.name = 'Galaxy S23' AND ss.variant = 'Ultra' THEN 260
        WHEN ss.name = 'Galaxy S23' THEN 200
        WHEN ss.name = 'Galaxy S22' AND ss.variant = 'Ultra' THEN 240
        WHEN ss.name = 'Galaxy S22' THEN 180
        WHEN ss.name = 'Galaxy S21' AND ss.variant = 'Ultra' THEN 220
        WHEN ss.name = 'Galaxy S21' THEN 160
        ELSE 200
    END,
    50,
    CASE 
        WHEN ss.name = 'Galaxy S24' AND ss.variant = 'Ultra' THEN 349
        WHEN ss.name = 'Galaxy S24' THEN 289
        WHEN ss.name = 'Galaxy S23' AND ss.variant = 'Ultra' THEN 329
        WHEN ss.name = 'Galaxy S23' THEN 269
        WHEN ss.name = 'Galaxy S22' AND ss.variant = 'Ultra' THEN 309
        WHEN ss.name = 'Galaxy S22' THEN 249
        WHEN ss.name = 'Galaxy S21' AND ss.variant = 'Ultra' THEN 289
        WHEN ss.name = 'Galaxy S21' THEN 229
        ELSE 269
    END,
    false,
    1.0,
    NOW()
FROM samsung_s_series ss
CROSS JOIN screen_repair sr;

-- ============================================
-- 8. SAMPLE CUSTOMERS (for testing)
-- ============================================

INSERT INTO customers (first_name, last_name, phone, email, notification_preference, created_at) VALUES
('John', 'Smith', '+1 (555) 123-4567', 'john.smith@email.com', 'both', NOW()),
('Sarah', 'Johnson', '+1 (555) 234-5678', 'sarah.j@email.com', 'sms', NOW()),
('Michael', 'Williams', '+1 (555) 345-6789', NULL, 'sms', NOW()),
('Emily', 'Brown', '+1 (555) 456-7890', 'emily.brown@email.com', 'email', NOW()),
('David', 'Jones', '+1 (555) 567-8901', 'david.jones@email.com', 'both', NOW()),
('Lisa', 'Miller', '+1 (555) 678-9012', NULL, 'sms', NOW()),
('Robert', 'Davis', '+1 (555) 789-0123', 'rob.davis@email.com', 'both', NOW()),
('Jennifer', 'Garcia', '+1 (555) 890-1234', 'jen.garcia@email.com', 'sms', NOW()),
('William', 'Rodriguez', '+1 (555) 901-2345', NULL, 'sms', NOW()),
('Maria', 'Martinez', '+1 (555) 012-3456', 'maria.m@email.com', 'both', NOW());

-- ============================================
-- 9. SAMPLE REPAIRS (for testing)
-- ============================================

-- Get IDs for sample data
WITH sample_customer AS (
    SELECT id FROM customers WHERE first_name = 'John' AND last_name = 'Smith' LIMIT 1
),
iphone_14 AS (
    SELECT dm.id 
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Apple' AND dm.name = 'iPhone 14' AND dm.variant = 'Standard'
    LIMIT 1
)
INSERT INTO repairs (
    repair_number, 
    customer_id, 
    device_model_id, 
    device_imei,
    device_condition,
    status, 
    priority, 
    estimated_completion, 
    total_cost, 
    deposit_paid,
    notes,
    created_at,
    updated_at
)
SELECT 
    'RR-20250110-001',
    sc.id,
    iph.id,
    '359876543210987',
    'Screen cracked in upper right corner. Back glass intact. No water damage.',
    'in_progress',
    'standard',
    NOW() + INTERVAL '2 days',
    259.00,
    50.00,
    'Customer wants original screen. Backup completed.',
    NOW() - INTERVAL '1 day',
    NOW()
FROM sample_customer sc
CROSS JOIN iphone_14 iph;

-- Add repair items for the sample repair
WITH sample_repair AS (
    SELECT id FROM repairs WHERE repair_number = 'RR-20250110-001' LIMIT 1
),
screen_type AS (
    SELECT id FROM repair_types WHERE name = 'Screen Replacement (OLED)' LIMIT 1
),
iphone_14 AS (
    SELECT dm.id 
    FROM device_models dm
    JOIN brands b ON dm.brand_id = b.id
    WHERE b.name = 'Apple' AND dm.name = 'iPhone 14' AND dm.variant = 'Standard'
    LIMIT 1
),
price_record AS (
    SELECT p.id
    FROM prices p
    JOIN repair_types rt ON p.repair_type_id = rt.id
    JOIN (SELECT id FROM iphone_14) dm ON p.device_model_id = dm.id
    WHERE rt.name = 'Screen Replacement (OLED)' 
    AND p.parts_quality = 'original'
    LIMIT 1
)
INSERT INTO repair_items (repair_id, repair_type_id, parts_quality, price_id, final_price, price_overridden, status)
SELECT 
    sr.id,
    st.id,
    'original'::parts_quality,
    pr.id,
    259.00,
    false,
    'pending'
FROM sample_repair sr
CROSS JOIN screen_type st
CROSS JOIN price_record pr;

-- ============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Already covered in schema, but adding commonly used ones:
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at ON repairs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_prices_lookup ON prices(device_model_id, repair_type_id, parts_quality);
CREATE INDEX IF NOT EXISTS idx_device_models_brand ON device_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_repair ON notifications(repair_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count records
SELECT 'brands' as table_name, COUNT(*) as count FROM brands
UNION ALL
SELECT 'device_models', COUNT(*) FROM device_models
UNION ALL
SELECT 'repair_types', COUNT(*) FROM repair_types
UNION ALL
SELECT 'prices', COUNT(*) FROM prices
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'repairs', COUNT(*) FROM repairs;

-- Show sample prices
SELECT 
    b.name as brand,
    dm.name as model,
    dm.variant,
    rt.name as repair_type,
    p.parts_quality,
    p.total_price
FROM prices p
JOIN device_models dm ON p.device_model_id = dm.id
JOIN brands b ON dm.brand_id = b.id
JOIN repair_types rt ON p.repair_type_id = rt.id
ORDER BY b.name, dm.name, rt.name, p.parts_quality
LIMIT 20;

-- ============================================
-- DONE!
-- ============================================
-- Database is now seeded with:
-- - 8 brands (Apple, Samsung, Google, etc.)
-- - 50+ device models
-- - 27 repair types
-- - 100+ price records
-- - 10 sample customers
-- - 1 sample repair
-- Ready for testing and development!
