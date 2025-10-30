-- Computer Shop Database Schema
-- PostgreSQL Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS users_seq START 1;
CREATE SEQUENCE IF NOT EXISTS categories_seq START 1;
CREATE SEQUENCE IF NOT EXISTS products_seq START 1;
CREATE SEQUENCE IF NOT EXISTS product_images_seq START 1;
CREATE SEQUENCE IF NOT EXISTS carts_seq START 1;
CREATE SEQUENCE IF NOT EXISTS cart_items_seq START 1;
CREATE SEQUENCE IF NOT EXISTS orders_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_items_seq START 1;
CREATE SEQUENCE IF NOT EXISTS comments_seq START 1;
CREATE SEQUENCE IF NOT EXISTS inventory_logs_seq START 1;
CREATE SEQUENCE IF NOT EXISTS promotions_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tokens_seq START 1;
CREATE SEQUENCE IF NOT EXISTS roles_seq START 1;

-- Roles table
CREATE TABLE roles (
    id BIGINT PRIMARY KEY DEFAULT nextval('roles_seq'),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_seq'),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20), -- Tăng từ 15 lên 20 cho số điện thoại quốc tế
    address TEXT,
    role_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Categories table
CREATE TABLE categories (
    id BIGINT PRIMARY KEY DEFAULT nextval('categories_seq'),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE products (
    id BIGINT PRIMARY KEY DEFAULT nextval('products_seq'),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    category_id BIGINT NOT NULL,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_low_stock_threshold CHECK (low_stock_threshold >= 0)
);

-- Product images table
CREATE TABLE product_images (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_images_seq'),
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Carts table
CREATE TABLE carts (
    id BIGINT PRIMARY KEY DEFAULT nextval('carts_seq'),
    user_id BIGINT NOT NULL UNIQUE, -- Mỗi user chỉ có 1 cart
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('cart_items_seq'),
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0),
    UNIQUE(cart_id, product_id)
);

-- Orders table
CREATE TABLE orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('orders_seq'),
    order_code VARCHAR(50) UNIQUE NOT NULL, -- Mã đơn hàng để khách tra cứu
    user_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL, -- Snapshot tên khách hàng
    customer_email VARCHAR(100) NOT NULL, -- Snapshot email khách hàng
    total_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    promotion_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(20) DEFAULT 'COD',
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_total_amount CHECK (total_amount > 0), -- Phải lớn hơn 0
    CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0),
    CONSTRAINT chk_final_amount CHECK (final_amount > 0), -- Phải lớn hơn 0
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('COD'))
);

-- Order items table
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('order_items_seq'),
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL, -- Snapshot of product name at time of order
    quantity INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL, -- Snapshot of price at time of order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (price >= 0)
);

-- Comments table
CREATE TABLE comments (
    id BIGINT PRIMARY KEY DEFAULT nextval('comments_seq'),
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    parent_comment_id BIGINT,
    content TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Inventory logs table
CREATE TABLE inventory_logs (
    id BIGINT PRIMARY KEY DEFAULT nextval('inventory_logs_seq'),
    product_id BIGINT NOT NULL,
    change_type VARCHAR(10) NOT NULL,
    quantity_change INTEGER NOT NULL, -- Số lượng thay đổi (+/-)
    reason VARCHAR(200),
    performed_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_change_type CHECK (change_type IN ('IN', 'OUT'))
);

-- Promotions table
CREATE TABLE promotions (
    id BIGINT PRIMARY KEY DEFAULT nextval('promotions_seq'),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    minimum_order_amount DECIMAL(15,2) DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT chk_discount_value CHECK (discount_value > 0),
    CONSTRAINT chk_minimum_order_amount CHECK (minimum_order_amount >= 0),
    CONSTRAINT chk_date_range CHECK (end_date > start_date)
);

-- Tokens table
CREATE TABLE tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('tokens_seq'),
    token VARCHAR(500) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'ACCESS_TOKEN',
    expiration_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    expired BOOLEAN NOT NULL DEFAULT false,
    user_id BIGINT NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_token_type CHECK (token_type IN ('ACCESS_TOKEN', 'REFRESH_TOKEN', 'RESET_PASSWORD', 'EMAIL_VERIFICATION'))
);

-- Add foreign key for promotions in orders table
ALTER TABLE orders ADD CONSTRAINT fk_orders_promotion 
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_roles_name ON roles(name);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(quantity, low_stock_threshold);
CREATE INDEX idx_products_specifications ON products USING GIN (specifications);

-- OPTIMIZED: Composite indexes cho filtering queries phức tạp
CREATE INDEX idx_products_category_price ON products(category_id, price) WHERE is_active = true;
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_active_price ON products(is_active, price);
CREATE INDEX idx_products_quantity_active ON products(quantity, is_active);

-- OPTIMIZED: Full-text search index cho product name (PostgreSQL specific)
CREATE INDEX idx_products_name_fulltext ON products USING GIN (to_tsvector('english', name));
CREATE INDEX idx_products_description_fulltext ON products USING GIN (to_tsvector('english', description));

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(is_primary);

CREATE INDEX idx_carts_user ON carts(user_id);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- OPTIMIZED: Composite index cho cart JOIN operations
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_promotion ON orders(promotion_id);
CREATE INDEX idx_orders_order_code ON orders(order_code);

-- OPTIMIZED: Composite indexes cho order filtering/searching
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_comments_product ON comments(product_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_staff_reply ON comments(is_staff_reply);

-- OPTIMIZED: Composite index cho comment queries (root comments vs replies)
CREATE INDEX idx_comments_product_parent ON comments(product_id, parent_comment_id);
CREATE INDEX idx_comments_product_created ON comments(product_id, created_at DESC) WHERE parent_comment_id IS NULL;

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_performed_by ON inventory_logs(performed_by);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_change_type ON inventory_logs(change_type);

CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_discount_type ON promotions(discount_type);

CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_expiration ON tokens(expiration_date);
CREATE INDEX idx_tokens_type ON tokens(token_type);
CREATE INDEX idx_tokens_revoked ON tokens(revoked);
CREATE INDEX idx_tokens_expired ON tokens(expired);

CREATE INDEX idx_product_name ON products USING GIN (to_tsvector('english', name));
CREATE INDEX idx_product_category ON products(category_id) WHERE is_active = true;
CREATE INDEX idx_product_price ON products(price) WHERE is_active = true;
CREATE INDEX idx_product_quantity ON products(quantity) WHERE is_active = true;

-- Index cho JOIN
CREATE INDEX idx_cart_item_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX idx_order_user_status ON orders(user_id, status);
CREATE INDEX idx_comment_product ON comments(product_id) WHERE parent_comment_id IS NULL;

-- Composite index cho filtering
CREATE INDEX idx_product_category_price ON products(category_id, price) WHERE is_active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert roles
INSERT INTO roles (name) VALUES 
('ADMIN'),
('STAFF'),
('CUSTOMER');

-- Insert categories
INSERT INTO categories (name, description) VALUES 
('CPU', 'Bộ vi xử lý'),
('VGA', 'Card đồ họa'),
('RAM', 'Bộ nhớ trong'),
('Mainboard', 'Bo mạch chủ'),
('PSU', 'Nguồn máy tính'),
('Storage', 'Thiết bị lưu trữ'),
('Cooling', 'Tản nhiệt'),
('Case', 'Vỏ máy tính'),
('Monitor', 'Màn hình máy tính'),
('Keyboard', 'Bàn phím'),
('Mouse', 'Chuột máy tính'),
('Headset', 'Tai nghe');

-- Insert subcategories
INSERT INTO categories (name, description, parent_category_id) VALUES 
('SSD', 'Ổ cứng thể rắn', (SELECT id FROM categories WHERE name = 'Storage')),
('HDD', 'Ổ cứng cơ học', (SELECT id FROM categories WHERE name = 'Storage')),
('Air Cooling', 'Tản nhiệt khí', (SELECT id FROM categories WHERE name = 'Cooling')),
('Water Cooling', 'Tản nhiệt nước', (SELECT id FROM categories WHERE name = 'Cooling'));

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role_id) VALUES 
('admin', 'admin@computershop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 
 (SELECT id FROM roles WHERE name = 'ADMIN'));

-- Insert staff user (password: staff123)
INSERT INTO users (username, email, password, full_name, role_id) VALUES 
('staff', 'staff@computershop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff Member', 
 (SELECT id FROM roles WHERE name = 'STAFF'));

-- Insert 30 sample products

-- CPU Products (6 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Intel Core i5-12400F', 'CPU Intel Core i5 thế hệ 12, 6 nhân 12 luồng', 4500000, 50, 10,
 (SELECT id FROM categories WHERE name = 'CPU'), 
 '{"cores": 6, "threads": 12, "base_clock": "2.5GHz", "boost_clock": "4.4GHz", "socket": "LGA1700"}'),

('AMD Ryzen 5 5600X', 'CPU AMD Ryzen 5 5600X, 6 nhân 12 luồng', 5200000, 45, 10,
 (SELECT id FROM categories WHERE name = 'CPU'),
 '{"cores": 6, "threads": 12, "base_clock": "3.7GHz", "boost_clock": "4.6GHz", "socket": "AM4"}'),

('Intel Core i7-12700K', 'CPU Intel Core i7 thế hệ 12, 12 nhân 20 luồng', 8500000, 30, 8,
 (SELECT id FROM categories WHERE name = 'CPU'),
 '{"cores": 12, "threads": 20, "base_clock": "3.6GHz", "boost_clock": "5.0GHz", "socket": "LGA1700"}'),

('AMD Ryzen 7 5700X', 'CPU AMD Ryzen 7 5700X, 8 nhân 16 luồng', 6800000, 35, 8,
 (SELECT id FROM categories WHERE name = 'CPU'),
 '{"cores": 8, "threads": 16, "base_clock": "3.4GHz", "boost_clock": "4.6GHz", "socket": "AM4"}'),

('Intel Core i3-12100F', 'CPU Intel Core i3 thế hệ 12, 4 nhân 8 luồng', 2800000, 60, 15,
 (SELECT id FROM categories WHERE name = 'CPU'),
 '{"cores": 4, "threads": 8, "base_clock": "3.3GHz", "boost_clock": "4.3GHz", "socket": "LGA1700"}'),

('AMD Ryzen 9 5900X', 'CPU AMD Ryzen 9 5900X, 12 nhân 24 luồng', 12500000, 20, 5,
 (SELECT id FROM categories WHERE name = 'CPU'),
 '{"cores": 12, "threads": 24, "base_clock": "3.7GHz", "boost_clock": "4.8GHz", "socket": "AM4"}');

-- VGA Products (5 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('NVIDIA RTX 4060', 'Card đồ họa RTX 4060 8GB GDDR6', 12000000, 30, 5,
 (SELECT id FROM categories WHERE name = 'VGA'),
 '{"memory": "8GB GDDR6", "memory_bus": "128-bit", "boost_clock": "2460MHz", "power": "115W"}'),

('NVIDIA RTX 4070', 'Card đồ họa RTX 4070 12GB GDDR6X', 18500000, 25, 5,
 (SELECT id FROM categories WHERE name = 'VGA'),
 '{"memory": "12GB GDDR6X", "memory_bus": "192-bit", "boost_clock": "2475MHz", "power": "200W"}'),

('AMD RX 6600 XT', 'Card đồ họa AMD RX 6600 XT 8GB GDDR6', 9500000, 40, 8,
 (SELECT id FROM categories WHERE name = 'VGA'),
 '{"memory": "8GB GDDR6", "memory_bus": "128-bit", "boost_clock": "2589MHz", "power": "160W"}'),

('NVIDIA RTX 3060 Ti', 'Card đồ họa RTX 3060 Ti 8GB GDDR6', 11000000, 35, 8,
 (SELECT id FROM categories WHERE name = 'VGA'),
 '{"memory": "8GB GDDR6", "memory_bus": "256-bit", "boost_clock": "1665MHz", "power": "200W"}'),

('AMD RX 7600', 'Card đồ họa AMD RX 7600 8GB GDDR6', 8800000, 28, 6,
 (SELECT id FROM categories WHERE name = 'VGA'),
 '{"memory": "8GB GDDR6", "memory_bus": "128-bit", "boost_clock": "2655MHz", "power": "165W"}');

-- RAM Products (4 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Corsair Vengeance LPX 16GB DDR4', 'RAM DDR4 16GB (2x8GB) 3200MHz', 2000000, 100, 20,
 (SELECT id FROM categories WHERE name = 'RAM'),
 '{"capacity": "16GB", "type": "DDR4", "speed": "3200MHz", "latency": "CL16", "kit": "2x8GB"}'),

('G.Skill Trident Z RGB 32GB DDR4', 'RAM DDR4 32GB (2x16GB) 3600MHz RGB', 4500000, 50, 10,
 (SELECT id FROM categories WHERE name = 'RAM'),
 '{"capacity": "32GB", "type": "DDR4", "speed": "3600MHz", "latency": "CL18", "kit": "2x16GB", "rgb": true}'),

('Kingston Fury Beast 16GB DDR4', 'RAM DDR4 16GB (2x8GB) 2666MHz', 1600000, 80, 15,
 (SELECT id FROM categories WHERE name = 'RAM'),
 '{"capacity": "16GB", "type": "DDR4", "speed": "2666MHz", "latency": "CL16", "kit": "2x8GB"}'),

('Corsair Dominator Platinum 32GB DDR5', 'RAM DDR5 32GB (2x16GB) 5600MHz', 8500000, 30, 8,
 (SELECT id FROM categories WHERE name = 'RAM'),
 '{"capacity": "32GB", "type": "DDR5", "speed": "5600MHz", "latency": "CL36", "kit": "2x16GB"}');

-- Mainboard Products (4 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('ASUS PRIME B550M-A', 'Mainboard AMD B550 Micro-ATX', 2500000, 25, 5,
 (SELECT id FROM categories WHERE name = 'Mainboard'),
 '{"socket": "AM4", "chipset": "B550", "form_factor": "Micro-ATX", "memory_support": "DDR4-4400", "pcie_slots": 2}'),

('MSI MAG B660M MORTAR', 'Mainboard Intel B660 Micro-ATX', 3200000, 20, 5,
 (SELECT id FROM categories WHERE name = 'Mainboard'),
 '{"socket": "LGA1700", "chipset": "B660", "form_factor": "Micro-ATX", "memory_support": "DDR4-4800", "pcie_slots": 2}'),

('ASUS ROG STRIX X570-E', 'Mainboard AMD X570 ATX Gaming', 6500000, 15, 3,
 (SELECT id FROM categories WHERE name = 'Mainboard'),
 '{"socket": "AM4", "chipset": "X570", "form_factor": "ATX", "memory_support": "DDR4-4400", "pcie_slots": 3, "wifi": true}'),

('Gigabyte Z690 AORUS ELITE', 'Mainboard Intel Z690 ATX', 5800000, 18, 4,
 (SELECT id FROM categories WHERE name = 'Mainboard'),
 '{"socket": "LGA1700", "chipset": "Z690", "form_factor": "ATX", "memory_support": "DDR4-5333", "pcie_slots": 3}');

-- PSU Products (3 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Seasonic Focus GX-650', 'Nguồn 650W 80+ Gold Full Modular', 2800000, 40, 10,
 (SELECT id FROM categories WHERE name = 'PSU'),
 '{"wattage": "650W", "efficiency": "80+ Gold", "modular": "Full Modular", "warranty": "10 years"}'),

('Corsair RM750x', 'Nguồn 750W 80+ Gold Full Modular', 3500000, 35, 8,
 (SELECT id FROM categories WHERE name = 'PSU'),
 '{"wattage": "750W", "efficiency": "80+ Gold", "modular": "Full Modular", "warranty": "10 years"}'),

('EVGA SuperNOVA 850 G5', 'Nguồn 850W 80+ Gold Full Modular', 4200000, 25, 6,
 (SELECT id FROM categories WHERE name = 'PSU'),
 '{"wattage": "850W", "efficiency": "80+ Gold", "modular": "Full Modular", "warranty": "10 years"}');

-- Storage Products (4 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Samsung 980 PRO 1TB', 'SSD NVMe M.2 1TB PCIe 4.0', 3200000, 60, 15,
 (SELECT id FROM categories WHERE name = 'SSD'),
 '{"capacity": "1TB", "interface": "NVMe M.2", "pcie": "4.0", "read_speed": "7000MB/s", "write_speed": "5000MB/s"}'),

('WD Black SN750 500GB', 'SSD NVMe M.2 500GB PCIe 3.0', 1800000, 70, 15,
 (SELECT id FROM categories WHERE name = 'SSD'),
 '{"capacity": "500GB", "interface": "NVMe M.2", "pcie": "3.0", "read_speed": "3430MB/s", "write_speed": "2600MB/s"}'),

('Seagate Barracuda 2TB', 'HDD 2TB 7200RPM SATA III', 1200000, 50, 12,
 (SELECT id FROM categories WHERE name = 'HDD'),
 '{"capacity": "2TB", "interface": "SATA III", "rpm": "7200RPM", "cache": "256MB"}'),

('Kingston NV2 1TB', 'SSD NVMe M.2 1TB PCIe 4.0', 2200000, 80, 18,
 (SELECT id FROM categories WHERE name = 'SSD'),
 '{"capacity": "1TB", "interface": "NVMe M.2", "pcie": "4.0", "read_speed": "3500MB/s", "write_speed": "2100MB/s"}');

-- Monitor Products (2 products)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('ASUS VG248QE 24"', 'Màn hình gaming 24" 144Hz 1ms', 4500000, 25, 5,
 (SELECT id FROM categories WHERE name = 'Monitor'),
 '{"size": "24 inch", "resolution": "1920x1080", "refresh_rate": "144Hz", "response_time": "1ms", "panel": "TN"}'),

('LG 27GL650F-B 27"', 'Màn hình gaming 27" 144Hz IPS', 6200000, 20, 4,
 (SELECT id FROM categories WHERE name = 'Monitor'),
 '{"size": "27 inch", "resolution": "1920x1080", "refresh_rate": "144Hz", "response_time": "1ms", "panel": "IPS"}');

-- Keyboard Products (1 product)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Logitech G Pro X', 'Bàn phím cơ gaming tenkeyless', 2800000, 30, 8,
 (SELECT id FROM categories WHERE name = 'Keyboard'),
 '{"layout": "Tenkeyless", "switch_type": "Hot-swappable", "backlight": "RGB", "connectivity": "USB-C"}');

-- Mouse Products (1 product)
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications) VALUES 
('Logitech G502 HERO', 'Chuột gaming có dây 25600 DPI', 1500000, 40, 10,
 (SELECT id FROM categories WHERE name = 'Mouse'),
 '{"dpi": "25600", "buttons": 11, "weight": "121g", "connectivity": "USB", "rgb": true}');



-- Insert sample promotions
INSERT INTO promotions (name, description, discount_type, discount_value, minimum_order_amount, start_date, end_date) VALUES 
('Khuyến mãi Tết 2025', 'Giảm 10% cho đơn hàng từ 10 triệu', 'PERCENTAGE', 10.00, 10000000, '2025-01-01 00:00:00', '2025-02-28 23:59:59'),
('Giảm giá linh kiện', 'Giảm 500K cho đơn hàng từ 5 triệu', 'FIXED_AMOUNT', 500000.00, 5000000, '2025-01-01 00:00:00', '2025-12-31 23:59:59');

-- Insert sample comments
INSERT INTO comments (user_id, product_id, content) VALUES 
((SELECT id FROM users WHERE username = 'admin'), 
 (SELECT id FROM products WHERE name = 'Intel Core i5-12400F'), 
 'CPU này có hiệu năng tốt không ạ?');

-- Insert staff reply
INSERT INTO comments (user_id, product_id, parent_comment_id, content, is_staff_reply) VALUES 
((SELECT id FROM users WHERE username = 'staff'),
 (SELECT id FROM products WHERE name = 'Intel Core i5-12400F'),
 (SELECT id FROM comments WHERE content = 'CPU này có hiệu năng tốt không ạ?'),
 'CPU Intel Core i5-12400F có hiệu năng rất tốt cho gaming và công việc văn phòng. Với 6 nhân 12 luồng, phù hợp cho các tác vụ đa nhiệm.',
 true);

-- Create a sample cart for demonstration
INSERT INTO carts (user_id) VALUES 
((SELECT id FROM users WHERE username = 'admin'));

COMMIT;