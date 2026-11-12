CREATE TABLE coupons (id {{PK}}, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL, value INTEGER NOT NULL, min_order INTEGER DEFAULT 0, max_uses INTEGER, used INTEGER DEFAULT 0, expires_at TEXT, product_id INTEGER, collection_id INTEGER, active INTEGER DEFAULT 1);
CREATE TABLE reviews (id {{PK}}, product_id INTEGER NOT NULL, customer_id INTEGER NOT NULL, rating INTEGER NOT NULL, comment TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE orders ADD COLUMN discount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN coupon_code TEXT
