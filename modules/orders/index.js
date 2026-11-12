const { unitPrice } = require('./pricing');
exports.name = 'orders';
exports.mount = (app, { db, auth }) => {
  app.post('/api/orders', async (req, res) => {
    const { items, customer = {} } = req.body;
    if (!Array.isArray(items) || !items.length || items.length > 100) return res.status(400).json({ error: 'Cart is empty' });
    for (const k of ['name', 'phone', 'email', 'address']) if (!customer[k]) return res.status(400).json({ error: `Missing ${k}` });
    let wholesale = false;
    if (req.user?.role === 'customer') wholesale = !!(await db.query('SELECT wholesale_approved w FROM customers WHERE id=?', [req.user.id]))[0]?.w;
    let total = 0; const lines = [];
    for (const it of items) {
      const qty = parseInt(it.qty);
      const [p] = await db.query("SELECT * FROM products WHERE id=? AND status='published'", [it.product_id]);
      if (!p || !(qty > 0)) return res.status(400).json({ error: 'Invalid item' });
      if (p.stock < qty) return res.status(409).json({ error: `Not enough stock for ${p.name}` });
      const price = unitPrice(p.retail_price, JSON.parse(p.tiers || '[]'), qty, wholesale);
      total += price * qty; lines.push([p.id, p.name, qty, price]);
    }
    const [o] = await db.query('INSERT INTO orders (customer_id,name,phone,email,state,city,address,notes,total) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id',
      [req.user?.role === 'customer' ? req.user.id : null, customer.name, customer.phone, customer.email, customer.state || '', customer.city || '', customer.address, customer.notes || '', total]);
    for (const l of lines) await db.query('INSERT INTO order_items (order_id,product_id,name,qty,unit_price) VALUES (?,?,?,?,?)', [o.id, ...l]);
    res.json({ order_id: o.id, total });
  });
  app.get('/api/my-orders', async (req, res) => req.user?.role === 'customer' ? res.json(await db.query('SELECT id,total,status,created_at FROM orders WHERE customer_id=? ORDER BY id DESC', [req.user.id])) : res.status(401).json({ error: 'Login required' }));
  app.get('/api/admin/orders', auth.requireAdmin, async (_q, res) => res.json(await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 200')));
  app.put('/api/admin/orders/:id/status', auth.requireAdmin, async (req, res) => {
    if (!['pending', 'paid', 'processing', 'ready', 'shipped', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Bad status' });
    await db.query('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]); res.json({ ok: true });
  });
};
