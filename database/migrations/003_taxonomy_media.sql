CREATE TABLE categories (id {{PK}}, name TEXT NOT NULL, parent_id INTEGER, image_url TEXT DEFAULT '');
CREATE TABLE collections (id {{PK}}, name TEXT NOT NULL, image_url TEXT DEFAULT '');
CREATE TABLE product_collections (product_id INTEGER NOT NULL, collection_id INTEGER NOT NULL, PRIMARY KEY (product_id, collection_id));
CREATE TABLE variants (id {{PK}}, product_id INTEGER NOT NULL, kind TEXT, label TEXT NOT NULL, sku TEXT, price INTEGER, stock INTEGER DEFAULT 0, image_url TEXT DEFAULT '');
CREATE TABLE media (id {{PK}}, url TEXT NOT NULL, filename TEXT, type TEXT, size INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE order_items ADD COLUMN variant_id INTEGER
