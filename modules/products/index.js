exports.name = 'products';
exports.mount = (app, { db, auth }) => {
  const parse = (p) => ({ ...p, tiers: JSON.parse(p.tiers || '[]') });
  app.get('/api/products', async (req, res) => {
    const w = ["status='published'"], a = [];
    if (req.query.category) { w.push('category=?'); a.push(String(req.query.category)); }
    if (req.query.collection) { w.push('id IN (SELECT product_id FROM product_collections WHERE collection_id=?)'); a.push(String(req.query.collection)); }
    res.json((await db.query(`SELECT id,name,description,image_url,category,brand,retail_price,tiers,stock FROM products WHERE ${w.join(' AND ')} ORDER BY id DESC`, a)).map(parse));
  });
  const fields = (b) => {
    if (!b.name || !Number.isInteger(b.retail_price) || b.retail_price < 0) return null;
    const tiers = Array.isArray(b.tiers) ? b.tiers.filter((t) => Number.isInteger(t.min) && Number.isInteger(t.price)) : [];
    return [b.name, b.description || '', b.sku || '', b.image_url || '', b.category || '', b.retail_price, JSON.stringify(tiers), Math.max(0, parseInt(b.stock) || 0), ['draft', 'published', 'archived'].includes(b.status) ? b.status : 'draft', b.brand || '', b.gtin || ''];
  };
  const cols = 'name,description,sku,image_url,category,retail_price,tiers,stock,status,brand,gtin';
  app.get('/api/admin/products', auth.requireAdmin, async (_q, res) => res.json((await db.query('SELECT * FROM products ORDER BY id DESC')).map(parse)));
  app.post('/api/admin/products', auth.requireAdmin, async (req, res) => {
    const f = fields(req.body); if (!f) return res.status(400).json({ error: 'name and integer retail_price required' });
    res.json((await db.query(`INSERT INTO products (${cols}) VALUES (${cols.split(',').map(() => '?').join(',')}) RETURNING id`, f))[0]);
  });
  app.put('/api/admin/products/:id', auth.requireAdmin, async (req, res) => {
    const f = fields(req.body); if (!f) return res.status(400).json({ error: 'name and integer retail_price required' });
    await db.query(`UPDATE products SET ${cols.split(',').map((c) => c + '=?').join(',')} WHERE id=?`, [...f, req.params.id]); res.json({ ok: true });
  });
  app.delete('/api/admin/products/:id', auth.requireAdmin, async (req, res) => { await db.query('DELETE FROM products WHERE id=?', [req.params.id]); res.json({ ok: true }); });
};
