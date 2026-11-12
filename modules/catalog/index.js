const { parse, stringify } = require('./csv');
exports.name = 'catalog';
const COLS = ['sku', 'name', 'description', 'category', 'brand', 'gtin', 'image_url', 'retail_price', 'tiers', 'stock', 'status'];
exports.mount = (app, { db, cfg, auth }) => {
  app.get('/api/admin/export/products.csv', auth.requireAdmin, async (_q, res) => {
    const ps = await db.query('SELECT * FROM products ORDER BY id');
    res.type('text/csv').attachment('products.csv').send(stringify([COLS, ...ps.map((p) => COLS.map((c) => p[c]))]));
  });
  // Step 1 (confirm=false): validate and report. Step 2 (confirm=true): apply. Nothing is overwritten without confirm.
  app.post('/api/admin/import/products', auth.requireAdmin, async (req, res) => {
    const rows = parse(String(req.body.csv || '')); if (rows.length < 2) return res.status(400).json({ error: 'File is empty' });
    const head = rows[0].map((h) => h.trim().toLowerCase());
    for (const need of ['sku', 'name', 'retail_price']) if (!head.includes(need)) return res.status(400).json({ error: `Missing column: ${need}` });
    const errors = [], valid = [];
    rows.slice(1).forEach((r, i) => {
      const o = Object.fromEntries(head.map((h, j) => [h, (r[j] || '').trim()])), line = i + 2;
      const price = Number(o.retail_price), stock = o.stock === '' ? 0 : Number(o.stock);
      let tiers = [];
      try { tiers = o.tiers ? JSON.parse(o.tiers) : []; if (!Array.isArray(tiers)) throw 0; } catch { return errors.push(`Line ${line}: tiers must be JSON like [{"min":50,"price":1000}]`); }
      if (!o.sku) return errors.push(`Line ${line}: sku is required`);
      if (!o.name) return errors.push(`Line ${line}: name is required`);
      if (!Number.isInteger(price) || price < 0) return errors.push(`Line ${line}: retail_price must be a whole number`);
      if (!Number.isInteger(stock) || stock < 0) return errors.push(`Line ${line}: stock must be a whole number`);
      valid.push({ ...o, retail_price: price, stock, tiers: JSON.stringify(tiers), status: ['draft', 'published', 'archived'].includes(o.status) ? o.status : 'draft' });
    });
    const skus = valid.map((v) => v.sku); const dup = skus.filter((s, i) => skus.indexOf(s) !== i);
    if (dup.length) errors.push('Duplicate SKUs in file: ' + [...new Set(dup)].join(', '));
    const existing = new Map((await db.query('SELECT id,sku FROM products')).map((p) => [p.sku, p.id]));
    const updates = valid.filter((v) => existing.has(v.sku)).length, creates = valid.length - updates;
    if (errors.length || !req.body.confirm) return res.json({ applied: false, errors, will_create: creates, will_update: updates, warning: updates ? `${updates} existing product(s) will be overwritten.` : '' });
    const set = COLS.slice(1);
    for (const v of valid) {
      const vals = set.map((c) => v[c] ?? '');
      if (existing.has(v.sku)) await db.query(`UPDATE products SET ${set.map((c) => c + '=?').join(',')} WHERE id=?`, [...vals, existing.get(v.sku)]);
      else await db.query(`INSERT INTO products (sku,${set.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`, [v.sku, ...vals]);
    }
    res.json({ applied: true, created: creates, updated: updates, errors: [] });
  });
  // Public Meta/Facebook catalog feed. Paste this URL into Commerce Manager > Data sources > Scheduled feed.
  app.get('/feeds/meta.csv', async (_q, res) => {
    const ps = await db.query("SELECT * FROM products WHERE status='published' ORDER BY id");
    const H = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'gtin', 'inventory'];
    res.type('text/csv').send(stringify([H, ...ps.map((p) => [p.sku || p.id, p.name, p.description || p.name, p.stock > 0 ? 'in stock' : 'out of stock', 'new', `${p.retail_price}.00 NGN`, `${cfg.publicUrl}/product.html?id=${p.id}`, p.image_url, p.brand || 'Store', p.gtin, p.stock])]));
  });
};
