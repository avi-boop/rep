-- Mobile Repair Shop Dashboard - Database Setup Script
-- PostgreSQL 12+

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE device_type_enum AS ENUM ('phone', 'tablet');
CREATE TYPE repair_status_enum AS ENUM ('pending', 'in_progress', 'waiting_parts', 'completed', 'ready_pickup', 'delivered', 'cancelled');
CREATE TYPE priority_enum AS ENUM ('normal', 'urgent', 'express');
CREATE TYPE repair_item_status_enum AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE notification_type_enum AS ENUM ('sms', 'email', 'push');
CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Brands Table
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_primary BOOLEAN DEFAULT false,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_is_primary ON brands(is_primary);

-- Device Models Table
CREATE TABLE device_models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model_number VARCHAR(50),
    release_year INTEGER,
    device_type device_type_enum NOT NULL,
    screen_size DECIMAL(3, 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, name)
);

CREATE INDEX idx_device_models_brand_id ON device_models(brand_id);
CREATE INDEX idx_device_models_release_year ON device_models(release_year);
CREATE INDEX idx_device_models_device_type ON device_models(device_type);

-- Repair Types Table
CREATE TABLE repair_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    estimated_duration INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_types_category ON repair_types(category);

-- Part Types Table
CREATE TABLE part_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    quality_level INTEGER CHECK (quality_level BETWEEN 1 AND 5),
    warranty_months INTEGER DEFAULT 3,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Table
CREATE TABLE pricing (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
    repair_type_id INTEGER NOT NULL REFERENCES repair_types(id) ON DELETE CASCADE,
    part_type_id INTEGER NOT NULL REFERENCES part_types(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    is_active BOOLEAN DEFAULT true,
    is_estimated BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_model_id, repair_type_id, part_type_id, valid_from)
);

CREATE INDEX idx_pricing_device_model_id ON pricing(device_model_id);
CREATE INDEX idx_pricing_repair_type_id ON pricing(repair_type_id);
CREATE INDEX idx_pricing_part_type_id ON pricing(part_type_id);
CREATE INDEX idx_pricing_is_estimated ON pricing(is_estimated);
CREATE INDEX idx_pricing_is_active ON pricing(is_active);

-- Price History Table
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    pricing_id INTEGER NOT NULL REFERENCES pricing(id) ON DELETE CASCADE,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    old_cost DECIMAL(10, 2),
    new_cost DECIMAL(10, 2),
    reason VARCHAR(255),
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_pricing_id ON price_history(pricing_id);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    lightspeed_id VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": false}'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

CREATE INDEX idx_customers_lightspeed_id ON customers(lightspeed_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Repair Orders Table
CREATE TABLE repair_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    device_model_id INTEGER NOT NULL REFERENCES device_models(id),
    device_imei VARCHAR(50),
    device_serial VARCHAR(50),
    device_password VARCHAR(100),
    status repair_status_enum NOT NULL DEFAULT 'pending',
    priority priority_enum DEFAULT 'normal',
    issue_description TEXT,
    cosmetic_condition TEXT,
    estimated_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    total_price DECIMAL(10, 2) DEFAULT 0 CHECK (total_price >= 0),
    deposit_paid DECIMAL(10, 2) DEFAULT 0 CHECK (deposit_paid >= 0),
    balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_price - deposit_paid) STORED,
    assigned_technician_id INTEGER,
    checked_in_by INTEGER,
    checked_out_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_orders_customer_id ON repair_orders(customer_id);
CREATE INDEX idx_repair_orders_device_model_id ON repair_orders(device_model_id);
CREATE INDEX idx_repair_orders_status ON repair_orders(status);
CREATE INDEX idx_repair_orders_priority ON repair_orders(priority);
CREATE INDEX idx_repair_orders_created_at ON repair_orders(created_at);
CREATE INDEX idx_repair_orders_order_number ON repair_orders(order_number);

-- Repair Order Items Table
CREATE TABLE repair_order_items (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    repair_type_id INTEGER NOT NULL REFERENCES repair_types(id),
    part_type_id INTEGER NOT NULL REFERENCES part_types(id),
    pricing_id INTEGER REFERENCES pricing(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    status repair_item_status_enum DEFAULT 'pending',
    technician_notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_order_items_repair_order_id ON repair_order_items(repair_order_id);
CREATE INDEX idx_repair_order_items_status ON repair_order_items(status);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER REFERENCES repair_orders(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    type notification_type_enum NOT NULL,
    event_type VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status notification_status_enum DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    external_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_repair_order_id ON notifications(repair_order_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Order Status History Table (for tracking status changes)
CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    old_status repair_status_enum,
    new_status repair_status_enum NOT NULL,
    notes TEXT,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_history_repair_order_id ON order_status_history(repair_order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at);

-- Photos Table
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(50), -- 'before', 'after', 'issue', 'testing'
    description TEXT,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_repair_order_id ON photos(repair_order_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_models_updated_at BEFORE UPDATE ON device_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_types_updated_at BEFORE UPDATE ON repair_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_part_types_updated_at BEFORE UPDATE ON part_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_orders_updated_at BEFORE UPDATE ON repair_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_order_items_updated_at BEFORE UPDATE ON repair_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_order_number VARCHAR(50);
    order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count FROM repair_orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    new_order_number := 'R' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((order_count + 1)::TEXT, 4, '0');
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_repair_order_number BEFORE INSERT ON repair_orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price != NEW.price OR OLD.cost != NEW.cost THEN
        INSERT INTO price_history (pricing_id, old_price, new_price, old_cost, new_cost, reason)
        VALUES (OLD.id, OLD.price, NEW.price, OLD.cost, NEW.cost, 'Price updated');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_price_changes AFTER UPDATE ON pricing
    FOR EACH ROW EXECUTE FUNCTION log_price_change();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (repair_order_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_status_changes AFTER UPDATE ON repair_orders
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Insert Primary Brands
INSERT INTO brands (name, is_primary) VALUES
('Apple', true),
('Samsung', true),
('Google', false),
('OnePlus', false),
('Xiaomi', false),
('Huawei', false),
('Motorola', false),
('LG', false),
('Other', false);

-- Insert Repair Types
INSERT INTO repair_types (name, category, estimated_duration) VALUES
('Front Screen', 'screen', 45),
('Back Panel', 'body', 30),
('Battery', 'battery', 30),
('Charging Port', 'port', 60),
('Audio Speaker', 'audio', 45),
('Earpiece Speaker', 'audio', 45),
('Microphone', 'audio', 45),
('Camera - Rear', 'camera', 40),
('Camera - Front', 'camera', 40),
('Camera Lens', 'camera', 20),
('Motherboard Repair', 'board', 120),
('Water Damage Repair', 'board', 180),
('Face ID Repair', 'sensor', 90),
('Touch ID Repair', 'sensor', 60),
('Vibration Motor', 'component', 30),
('Power Button', 'button', 45),
('Volume Button', 'button', 45),
('Home Button', 'button', 45),
('SIM Tray', 'component', 15),
('Software Issue', 'software', 30),
('Data Recovery', 'software', 120);

-- Insert Part Types
INSERT INTO part_types (name, quality_level, warranty_months, description) VALUES
('Original (OEM)', 5, 12, 'Original equipment manufacturer parts'),
('Aftermarket Premium', 4, 6, 'High-quality aftermarket parts'),
('Aftermarket Standard', 3, 3, 'Standard aftermarket parts');

-- Insert Sample Apple Devices
INSERT INTO device_models (brand_id, name, model_number, release_year, device_type, screen_size) VALUES
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 15 Pro Max', 'A2849', 2023, 'phone', 6.7),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 15 Pro', 'A2848', 2023, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 15', 'A2846', 2023, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 14 Pro Max', 'A2651', 2022, 'phone', 6.7),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 14 Pro', 'A2650', 2022, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 14', 'A2649', 2022, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 13 Pro Max', 'A2484', 2021, 'phone', 6.7),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 13 Pro', 'A2483', 2021, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 13', 'A2482', 2021, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 12 Pro Max', 'A2342', 2020, 'phone', 6.7),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 12', 'A2172', 2020, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 11 Pro Max', 'A2161', 2019, 'phone', 6.5),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPhone 11', 'A2111', 2019, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPad Pro 12.9" (6th gen)', 'A2436', 2022, 'tablet', 12.9),
((SELECT id FROM brands WHERE name = 'Apple'), 'iPad Air (5th gen)', 'A2589', 2022, 'tablet', 10.9);

-- Insert Sample Samsung Devices
INSERT INTO device_models (brand_id, name, model_number, release_year, device_type, screen_size) VALUES
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S24 Ultra', 'SM-S928', 2024, 'phone', 6.8),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S23 Ultra', 'SM-S918', 2023, 'phone', 6.8),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S23', 'SM-S911', 2023, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S22 Ultra', 'SM-S908', 2022, 'phone', 6.8),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S22', 'SM-S901', 2022, 'phone', 6.1),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy S21', 'SM-G991', 2021, 'phone', 6.2),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy Tab S9', 'SM-X710', 2023, 'tablet', 11.0),
((SELECT id FROM brands WHERE name = 'Samsung'), 'Galaxy Tab S8', 'SM-X706', 2022, 'tablet', 11.0);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active Repairs View
CREATE OR REPLACE VIEW v_active_repairs AS
SELECT 
    ro.id,
    ro.order_number,
    ro.status,
    ro.priority,
    ro.created_at,
    ro.estimated_completion,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone AS customer_phone,
    b.name AS brand,
    dm.name AS device_model,
    ro.total_price,
    ro.balance_due,
    COUNT(roi.id) AS repair_item_count
FROM repair_orders ro
JOIN customers c ON ro.customer_id = c.id
JOIN device_models dm ON ro.device_model_id = dm.id
JOIN brands b ON dm.brand_id = b.id
LEFT JOIN repair_order_items roi ON ro.id = roi.repair_order_id
WHERE ro.status NOT IN ('completed', 'delivered', 'cancelled')
GROUP BY ro.id, c.id, b.name, dm.name;

-- Pricing Grid View
CREATE OR REPLACE VIEW v_pricing_grid AS
SELECT 
    b.name AS brand,
    dm.name AS device_model,
    dm.release_year,
    rt.name AS repair_type,
    pt.name AS part_type,
    p.price,
    p.cost,
    p.price - p.cost AS margin,
    p.is_estimated,
    p.confidence_score,
    p.is_active
FROM pricing p
JOIN device_models dm ON p.device_model_id = dm.id
JOIN brands b ON dm.brand_id = b.id
JOIN repair_types rt ON p.repair_type_id = rt.id
JOIN part_types pt ON p.part_type_id = pt.id
WHERE p.is_active = true
    AND (p.valid_until IS NULL OR p.valid_until >= CURRENT_DATE)
ORDER BY b.name, dm.release_year DESC, rt.name, pt.quality_level DESC;

-- Daily Revenue View
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT 
    DATE(ro.created_at) AS date,
    COUNT(ro.id) AS total_orders,
    SUM(ro.total_price) AS total_revenue,
    SUM(ro.deposit_paid) AS deposits_collected,
    AVG(ro.total_price) AS avg_order_value,
    COUNT(CASE WHEN ro.status = 'completed' THEN 1 END) AS completed_orders
FROM repair_orders ro
GROUP BY DATE(ro.created_at)
ORDER BY date DESC;

-- ============================================================================
-- PERMISSIONS (Example - adjust based on your roles)
-- ============================================================================

-- Create roles (uncomment and customize as needed)
-- CREATE ROLE repair_admin;
-- CREATE ROLE repair_technician;
-- CREATE ROLE repair_frontdesk;

-- Grant permissions (example)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO repair_admin;
-- GRANT SELECT, INSERT, UPDATE ON repair_orders, repair_order_items TO repair_technician;
-- GRANT SELECT, INSERT ON repair_orders, customers TO repair_frontdesk;

-- ============================================================================
-- END OF DATABASE SETUP
-- ============================================================================

-- Query to verify setup
SELECT 
    'Brands' AS table_name, COUNT(*) AS record_count FROM brands
UNION ALL
SELECT 'Device Models', COUNT(*) FROM device_models
UNION ALL
SELECT 'Repair Types', COUNT(*) FROM repair_types
UNION ALL
SELECT 'Part Types', COUNT(*) FROM part_types;
