-- Mobile Repair Shop Dashboard - Database Schema
-- PostgreSQL Version

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'technician', 'front_desk')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. DEVICES & MODELS
-- ============================================

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(50) NOT NULL, -- iPhone, Samsung, Google, etc.
    model VARCHAR(100) NOT NULL, -- iPhone 13, Galaxy S21, etc.
    model_year INTEGER, -- For sorting and smart pricing
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('phone', 'tablet')),
    release_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand, model)
);

-- Index for faster queries
CREATE INDEX idx_devices_brand ON devices(brand);
CREATE INDEX idx_devices_type ON devices(device_type);

-- ============================================
-- 3. REPAIR TYPES
-- ============================================

CREATE TABLE repair_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Front Screen, Battery, etc.
    description TEXT,
    category VARCHAR(50), -- Display, Power, Audio, Camera, etc.
    estimated_time_minutes INTEGER, -- Average time to complete
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. PRICING
-- ============================================

CREATE TABLE pricing (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    repair_type_id INTEGER NOT NULL REFERENCES repair_types(id) ON DELETE CASCADE,
    part_quality VARCHAR(20) NOT NULL CHECK (part_quality IN ('original', 'aftermarket')),
    cost_price DECIMAL(10, 2) NOT NULL, -- What shop pays
    selling_price DECIMAL(10, 2) NOT NULL, -- What customer pays
    is_active BOOLEAN DEFAULT TRUE,
    is_estimated BOOLEAN DEFAULT FALSE, -- TRUE if smart pricing estimate
    confidence_score INTEGER, -- 0-100 for estimated prices
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, repair_type_id, part_quality)
);

-- Index for faster price lookups
CREATE INDEX idx_pricing_device ON pricing(device_id);
CREATE INDEX idx_pricing_repair_type ON pricing(repair_type_id);
CREATE INDEX idx_pricing_estimated ON pricing(is_estimated);

-- ============================================
-- 5. CUSTOMERS
-- ============================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    lightspeed_customer_id VARCHAR(100), -- For future integration
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": false}'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for customer search
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_lightspeed ON customers(lightspeed_customer_id);
CREATE INDEX idx_customers_name ON customers(first_name, last_name);

-- ============================================
-- 6. REPAIR ORDERS
-- ============================================

CREATE TABLE repair_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL, -- RO-00001, RO-00002, etc.
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    device_imei VARCHAR(50), -- Optional IMEI for tracking
    device_passcode VARCHAR(50), -- Optional, encrypted
    device_condition_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'awaiting_parts', 'completed', 'ready_for_pickup', 'picked_up', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) DEFAULT 0,
    expected_completion_date DATE,
    completed_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id), -- Assigned technician
    internal_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generate order number automatically
CREATE SEQUENCE repair_order_seq START 1;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'RO-' || LPAD(nextval('repair_order_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE TRIGGER set_order_number
    BEFORE INSERT ON repair_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Indexes for repair orders
CREATE INDEX idx_orders_customer ON repair_orders(customer_id);
CREATE INDEX idx_orders_status ON repair_orders(status);
CREATE INDEX idx_orders_created ON repair_orders(created_at DESC);
CREATE INDEX idx_orders_assigned ON repair_orders(assigned_to);

-- ============================================
-- 7. REPAIR ORDER ITEMS
-- ============================================

CREATE TABLE repair_order_items (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    repair_type_id INTEGER NOT NULL REFERENCES repair_types(id) ON DELETE RESTRICT,
    pricing_id INTEGER REFERENCES pricing(id) ON DELETE RESTRICT,
    part_quality VARCHAR(20) NOT NULL CHECK (part_quality IN ('original', 'aftermarket')),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for repair order items
CREATE INDEX idx_order_items_order ON repair_order_items(repair_order_id);
CREATE INDEX idx_order_items_repair_type ON repair_order_items(repair_type_id);

-- ============================================
-- 8. INVENTORY
-- ============================================

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    repair_type_id INTEGER NOT NULL REFERENCES repair_types(id) ON DELETE CASCADE,
    part_quality VARCHAR(20) NOT NULL CHECK (part_quality IN ('original', 'aftermarket')),
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 5,
    cost_per_unit DECIMAL(10, 2),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    supplier_part_number VARCHAR(100),
    last_order_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, repair_type_id, part_quality)
);

-- Index for inventory
CREATE INDEX idx_inventory_device ON inventory(device_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity_in_stock, minimum_stock_level);

-- ============================================
-- 9. INVENTORY TRANSACTIONS
-- ============================================

CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    repair_order_id INTEGER REFERENCES repair_orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL, -- Positive for additions, negative for usage
    quantity_after INTEGER NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for inventory transactions
CREATE INDEX idx_inventory_trans_inventory ON inventory_transactions(inventory_id);
CREATE INDEX idx_inventory_trans_order ON inventory_transactions(repair_order_id);

-- ============================================
-- 10. NOTIFICATIONS
-- ============================================

CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    template_type VARCHAR(30) NOT NULL CHECK (template_type IN ('order_created', 'status_update', 'ready_for_pickup', 'reminder', 'custom')),
    message_content TEXT NOT NULL,
    -- Placeholders: {customer_name}, {order_number}, {device_model}, {repair_type}, {total_price}, {expected_date}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications_log (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER REFERENCES repair_orders(id) ON DELETE SET NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES notification_templates(id) ON DELETE SET NULL,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('sms', 'email', 'push')),
    recipient VARCHAR(255) NOT NULL, -- Phone number or email
    message_content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    error_message TEXT,
    external_id VARCHAR(255), -- Twilio/SendGrid message ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for notifications
CREATE INDEX idx_notifications_order ON notifications_log(repair_order_id);
CREATE INDEX idx_notifications_customer ON notifications_log(customer_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);

-- ============================================
-- 11. LIGHTSPEED INTEGRATION
-- ============================================

CREATE TABLE lightspeed_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(30) NOT NULL CHECK (sync_type IN ('customers', 'orders', 'products', 'inventory')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    sync_duration_seconds INTEGER,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer mapping for Lightspeed
CREATE TABLE lightspeed_customer_mapping (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lightspeed_customer_id VARCHAR(100) NOT NULL,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id),
    UNIQUE(lightspeed_customer_id)
);

-- ============================================
-- 12. ACTIVITY LOG (Audit Trail)
-- ============================================

CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
    entity_type VARCHAR(50) NOT NULL, -- 'repair_order', 'customer', 'pricing', etc.
    entity_id INTEGER NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for activity log
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ============================================
-- 13. DEVICE PHOTOS
-- ============================================

CREATE TABLE device_photos (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('before', 'during', 'after')),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    notes TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for device photos
CREATE INDEX idx_photos_order ON device_photos(repair_order_id);

-- ============================================
-- 14. WARRANTY TRACKING
-- ============================================

CREATE TABLE warranties (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    repair_item_id INTEGER NOT NULL REFERENCES repair_order_items(id) ON DELETE CASCADE,
    warranty_period_days INTEGER DEFAULT 90, -- 90 days default
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    claim_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for warranties
CREATE INDEX idx_warranties_order ON warranties(repair_order_id);
CREATE INDEX idx_warranties_end_date ON warranties(warranty_end_date);

-- ============================================
-- 15. CUSTOMER FEEDBACK
-- ============================================

CREATE TABLE customer_feedback (
    id SERIAL PRIMARY KEY,
    repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    would_recommend BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for feedback
CREATE INDEX idx_feedback_order ON customer_feedback(repair_order_id);
CREATE INDEX idx_feedback_rating ON customer_feedback(rating);

-- ============================================
-- SAMPLE DATA INSERT
-- ============================================

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@repairshop.com', '$2b$10$rZVqvqvqvqvqvqvqvqvqv', 'admin');

-- Insert common repair types
INSERT INTO repair_types (name, category, estimated_time_minutes) VALUES
('Front Screen', 'Display', 45),
('Back Glass', 'Display', 60),
('Battery', 'Power', 30),
('Charging Port', 'Power', 40),
('Camera (Rear)', 'Camera', 35),
('Camera (Front)', 'Camera', 30),
('Audio Jack', 'Audio', 40),
('Speaker', 'Audio', 35),
('Microphone', 'Audio', 30),
('Water Damage Repair', 'Motherboard', 120),
('Motherboard Repair', 'Motherboard', 180);

-- Insert common devices
INSERT INTO devices (brand, model, device_type, model_year, release_date) VALUES
-- iPhones
('Apple', 'iPhone 15 Pro Max', 'phone', 2023, '2023-09-22'),
('Apple', 'iPhone 15 Pro', 'phone', 2023, '2023-09-22'),
('Apple', 'iPhone 15', 'phone', 2023, '2023-09-22'),
('Apple', 'iPhone 14 Pro Max', 'phone', 2022, '2022-09-16'),
('Apple', 'iPhone 14 Pro', 'phone', 2022, '2022-09-16'),
('Apple', 'iPhone 14', 'phone', 2022, '2022-09-16'),
('Apple', 'iPhone 13 Pro Max', 'phone', 2021, '2021-09-24'),
('Apple', 'iPhone 13 Pro', 'phone', 2021, '2021-09-24'),
('Apple', 'iPhone 13', 'phone', 2021, '2021-09-24'),
('Apple', 'iPhone 12 Pro Max', 'phone', 2020, '2020-10-23'),
('Apple', 'iPhone 12 Pro', 'phone', 2020, '2020-10-23'),
('Apple', 'iPhone 12', 'phone', 2020, '2020-10-23'),
('Apple', 'iPhone 11 Pro Max', 'phone', 2019, '2019-09-20'),
('Apple', 'iPhone 11 Pro', 'phone', 2019, '2019-09-20'),
('Apple', 'iPhone 11', 'phone', 2019, '2019-09-20'),
-- Samsung
('Samsung', 'Galaxy S23 Ultra', 'phone', 2023, '2023-02-17'),
('Samsung', 'Galaxy S23+', 'phone', 2023, '2023-02-17'),
('Samsung', 'Galaxy S23', 'phone', 2023, '2023-02-17'),
('Samsung', 'Galaxy S22 Ultra', 'phone', 2022, '2022-02-25'),
('Samsung', 'Galaxy S22+', 'phone', 2022, '2022-02-25'),
('Samsung', 'Galaxy S22', 'phone', 2022, '2022-02-25'),
('Samsung', 'Galaxy S21 Ultra', 'phone', 2021, '2021-01-29'),
('Samsung', 'Galaxy S21+', 'phone', 2021, '2021-01-29'),
('Samsung', 'Galaxy S21', 'phone', 2021, '2021-01-29'),
-- Tablets
('Apple', 'iPad Pro 12.9" (2023)', 'tablet', 2023, '2023-10-23'),
('Apple', 'iPad Pro 11" (2023)', 'tablet', 2023, '2023-10-23'),
('Samsung', 'Galaxy Tab S9 Ultra', 'tablet', 2023, '2023-08-11'),
('Samsung', 'Galaxy Tab S9+', 'tablet', 2023, '2023-08-11');

-- Insert default notification templates
INSERT INTO notification_templates (name, template_type, message_content) VALUES
('Order Created', 'order_created', 'Hi {customer_name}, we received your {device_model} for {repair_type}. Order #{order_number}. Expected completion: {expected_date}. Track your repair at: [link]'),
('Repair In Progress', 'status_update', 'Update for Order #{order_number}: Your {device_model} repair is now in progress. We''ll notify you when it''s ready for pickup!'),
('Ready for Pickup', 'ready_for_pickup', 'Great news {customer_name}! Your {device_model} is ready for pickup. Total: ${total_price}. Visit us at [address]. Order #{order_number}'),
('Pickup Reminder', 'reminder', 'Reminder: Your {device_model} (Order #{order_number}) is ready for pickup. Please collect it at your earliest convenience. Thank you!');

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- View: Active repair orders with customer and device info
CREATE VIEW v_active_repairs AS
SELECT 
    ro.id,
    ro.order_number,
    ro.status,
    ro.priority,
    ro.expected_completion_date,
    ro.final_amount,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    d.brand || ' ' || d.model AS device_name,
    u.username AS assigned_technician,
    ro.created_at
FROM repair_orders ro
JOIN customers c ON ro.customer_id = c.id
JOIN devices d ON ro.device_id = d.id
LEFT JOIN users u ON ro.assigned_to = u.id
WHERE ro.status NOT IN ('picked_up', 'cancelled')
ORDER BY 
    CASE ro.priority 
        WHEN 'urgent' THEN 1 
        ELSE 2 
    END,
    ro.expected_completion_date ASC;

-- View: Low stock inventory items
CREATE VIEW v_low_stock_items AS
SELECT 
    i.id,
    d.brand || ' ' || d.model AS device_name,
    rt.name AS repair_type,
    i.part_quality,
    i.quantity_in_stock,
    i.minimum_stock_level,
    i.supplier_name,
    i.supplier_contact
FROM inventory i
JOIN devices d ON i.device_id = d.id
JOIN repair_types rt ON i.repair_type_id = rt.id
WHERE i.quantity_in_stock <= i.minimum_stock_level
ORDER BY (i.minimum_stock_level - i.quantity_in_stock) DESC;

-- View: Pricing overview with device info
CREATE VIEW v_pricing_overview AS
SELECT 
    p.id,
    d.brand,
    d.model,
    d.device_type,
    rt.name AS repair_type,
    p.part_quality,
    p.cost_price,
    p.selling_price,
    p.is_estimated,
    p.confidence_score,
    (p.selling_price - p.cost_price) AS profit_margin
FROM pricing p
JOIN devices d ON p.device_id = d.id
JOIN repair_types rt ON p.repair_type_id = rt.id
WHERE p.is_active = TRUE
ORDER BY d.brand, d.model, rt.name, p.part_quality;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update repair order total
CREATE OR REPLACE FUNCTION update_repair_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repair_orders
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM repair_order_items
            WHERE repair_order_id = NEW.repair_order_id
        ),
        final_amount = (
            SELECT COALESCE(SUM(total_price), 0) - COALESCE(discount_amount, 0)
            FROM repair_order_items
            WHERE repair_order_id = NEW.repair_order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.repair_order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update totals
CREATE TRIGGER update_order_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON repair_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_order_total();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_types_updated_at BEFORE UPDATE ON repair_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_orders_updated_at BEFORE UPDATE ON repair_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Notes:
-- 1. Remember to change default admin password
-- 2. Set up proper backup schedule
-- 3. Configure connection pooling for production
-- 4. Add database encryption for sensitive fields (device_passcode)
-- 5. Set up read replicas for scaling if needed
