exports.name = 'taxonomy';
exports.mount = (app, { db, auth }) => {
  const A = auth.requireAdmin, str = (v) => String(v || '').trim().slice(0, 120);
  for (const t of ['categories', 'collections']) {
    app.get(`/api/${t}`, async (_q, res) => res.json(await db.query(`SELECT * FROM ${t} ORDER BY name`)));
    app.post(`/api/admin/${t}`, A, async (req, res) => {
      if (!str(req.body.name)) return res.status(400).json({ error: 'Name required' });
      const parent = t === 'categories' ? ',parent_id' : '';
      res.json((await db.query(`INSERT INTO ${t} (name,image_url${parent}) VALUES (?,?${parent ? ',?' : ''}) RETURNING id`, [str(req.body.name), str(req.body.image_url), ...(parent ? [req.body.parent_id || null] : [])]))[0]);
    });
    app.delete(`/api/admin/${t}/:id`, A, async (req, res) => {
      if (t === 'collections') await db.query('DELETE FROM product_collections WHERE collection_id=?', [req.params.id]);
      await db.query(`DELETE FROM ${t} WHERE id=?`, [req.params.id]); res.json({ ok: true });
    });
  }
  // Manual collection membership (replaces the list). A product can be in many collections.
  app.put('/api/admin/collections/:id/products', A, async (req, res) => {
    const ids = (Array.isArray(req.body.product_ids) ? req.body.product_ids : []).map(Number).filter(Number.isInteger);
    await db.query('DELETE FROM product_collections WHERE collection_id=?', [req.params.id]);
    for (const pid of ids) await db.query('INSERT INTO product_collections (product_id,collection_id) VALUES (?,?)', [pid, req.params.id]);
    res.json({ ok: true, count: ids.length });
  });
  app.get('/api/products/:id/variants', async (req, res) => res.json(await db.query('SELECT id,kind,label,price,stock,image_url FROM variants WHERE product_id=? ORDER BY id', [req.params.id])));
  app.post('/api/admin/products/:id/variants', A, async (req, res) => {
    const b = req.body, price = b.price === '' || b.price == null ? null : Number(b.price), stock = Number(b.stock || 0);
    if (!['Size', 'Colour', 'Material', 'Model'].includes(b.kind) || !str(b.label) || !Number.isInteger(stock) || stock < 0 || (price !== null && (!Number.isInteger(price) || price < 0))) return res.status(400).json({ error: 'kind (Size/Colour/Material/Model), label, whole-number price/stock required' });
    res.json((await db.query('INSERT INTO variants (product_id,kind,label,sku,price,stock,image_url) VALUES (?,?,?,?,?,?,?) RETURNING id', [req.params.id, b.kind, str(b.label), str(b.sku), price, stock, str(b.image_url)]))[0]);
  });
  app.delete('/api/admin/variants/:id', A, async (req, res) => { await db.query('DELETE FROM variants WHERE id=?', [req.params.id]); res.json({ ok: true }); });
};
