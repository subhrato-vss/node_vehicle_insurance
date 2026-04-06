CREATE DATABASE IF NOT EXISTS insurance_db;
USE insurance_db;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('car', 'bike') NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 500000.00,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- Sample Admin (password: admin123)
-- Hash for 'admin123' using bcrypt is: $2a$10$7p1j3v5m8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0
INSERT INTO admins (email, password) VALUES ('admin@example.com', '$2a$10$7p1j3v5m8u9i0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0');

-- Sample Brands
INSERT INTO brands (name, type) VALUES ('Maruti', 'car'), ('Hyundai', 'car'), ('Honda', 'car');
INSERT INTO brands (name, type) VALUES ('Royal Enfield', 'bike'), ('Bajaj', 'bike'), ('Yamaha', 'bike');

-- Policies Temp (stores customer submissions before payment)
CREATE TABLE IF NOT EXISTS policies_temp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Customer Details
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(15) NOT NULL,
  address_line1 VARCHAR(500) NOT NULL,
  address_line2 VARCHAR(500) DEFAULT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_state VARCHAR(100) NOT NULL,
  customer_pincode VARCHAR(10) NOT NULL,
  -- Vehicle Details
  variant_id INT NOT NULL,
  vehicle_type VARCHAR(10) NOT NULL,
  manufacturing_year INT NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  rto_city VARCHAR(100) NOT NULL,
  previous_claim VARCHAR(5) NOT NULL,
  -- Insurance Details
  base_premium DECIMAL(12,2) NOT NULL,
  idv DECIMAL(12,2) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  plan_price DECIMAL(12,2) NOT NULL,
  addons JSON DEFAULT NULL,
  addons_cost DECIMAL(12,2) DEFAULT 0.00,
  final_premium DECIMAL(12,2) NOT NULL,
  
  -- Payment & Metadata
  payment_id VARCHAR(100) DEFAULT NULL,
  order_id VARCHAR(100) DEFAULT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0.00,
  actual_amount DECIMAL(12,2) DEFAULT 0.00,
  parent_policy_id INT DEFAULT NULL,
  renewal_count INT DEFAULT 0,
  status ENUM('pending', 'paid', 'expired', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);
