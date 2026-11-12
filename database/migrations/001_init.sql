CREATE TABLE admins (id {{PK}}, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE customers (id {{PK}}, name TEXT, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, wholesale_approved INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE products (id {{PK}}, name TEXT NOT NULL, description TEXT DEFAULT '', sku TEXT, image_url TEXT, category TEXT, retail_price INTEGER NOT NULL, tiers TEXT DEFAULT '[]', stock INTEGER DEFAULT 0, status TEXT DEFAULT 'draft', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE orders (id {{PK}}, customer_id INTEGER, name TEXT, phone TEXT, email TEXT, state TEXT, city TEXT, address TEXT, notes TEXT, total INTEGER NOT NULL, status TEXT DEFAULT 'pending', payment_ref TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE order_items (id {{PK}}, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, name TEXT, qty INTEGER NOT NULL, unit_price INTEGER NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)
