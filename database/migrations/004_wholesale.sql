CREATE TABLE wholesale_requests (id {{PK}}, customer_id INTEGER NOT NULL, business_name TEXT, message TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
