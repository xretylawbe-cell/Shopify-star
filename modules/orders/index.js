const { unitPrice } = require('./pricing');
const { discountFor } = require('../coupons/apply');
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
      let v = null, base = p.retail_price, name = p.name, avail = p.stock;
      if (it.variant_id) {
        [v] = await db.query('SELECT * FROM variants WHERE id=? AND product_id=?', [it.variant_id, p.id]);
        if (!v) return res.status(400).json({ error: 'Invalid option' });
        base = v.price ?? base; name += ` (${v.label})`; avail = v.stock;
      } else if ((await db.query('SELECT 1 x FROM variants WHERE product_id=?', [p.id])).length) return res.status(400).json({ error: `Choose an option for ${p.name}` });
      if (avail < qty) return res.status(409).json({ error: `Not enough stock for ${name}` });
      const price = unitPrice(base, JSON.parse(p.tiers || '[]'), qty, wholesale);
      total += price * qty; lines.push([p.id, name, qty, price, v ? v.id : null]);
    }
    let discount = 0, couponCode = null;
    if (req.body.coupon) {
      const code = String(req.body.coupon).trim().toUpperCase();
      const [c] = await db.query('SELECT * FROM coupons WHERE code=?', [code]);
      const ids = c?.collection_id ? new Set((await db.query('SELECT product_id FROM product_collections WHERE collection_id=?', [c.collection_id])).map((r) => r.product_id)) : undefined;
      const r = discountFor(c, lines.map((l) => ({ product_id: l[0], qty: l[2], price: l[3] })), total, ids);
      if (r.error) return res.status(400).json({ error: r.error });
      discount = r.discount; couponCode = code;
    }
    const [o] = await db.query('INSERT INTO orders (customer_id,name,phone,email,state,city,address,notes,total,discount,coupon_code) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING id',
      [req.user?.role === 'customer' ? req.user.id : null, customer.name, customer.phone, customer.email, customer.state || '', customer.city || '', customer.address, customer.notes || '', total - discount, discount, couponCode]);
    for (const l of lines) await db.query('INSERT INTO order_items (order_id,product_id,name,qty,unit_price,variant_id) VALUES (?,?,?,?,?,?)', [o.id, ...l]);
    res.json({ order_id: o.id, total: total - discount, discount });
  });
  app.get('/api/my-orders', async (req, res) => req.user?.role === 'customer' ? res.json(await db.query('SELECT id,total,status,created_at FROM orders WHERE customer_id=? ORDER BY id DESC', [req.user.id])) : res.status(401).json({ error: 'Login required' }));
  app.get('/api/admin/orders', auth.requireAdmin, async (_q, res) => res.json(await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 200')));
  app.put('/api/admin/orders/:id/status', auth.requireAdmin, async (req, res) => {
    if (!['pending', 'paid', 'processing', 'ready', 'shipped', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Bad status' });
    await db.query('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]); res.json({ ok: true });
  });
};
