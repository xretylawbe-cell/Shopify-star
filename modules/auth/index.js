const bcrypt = require('bcryptjs'), express = require('express'), rateLimit = require('express-rate-limit');
exports.name = 'auth';
exports.mount = (app, { db, auth }) => {
  const r = express.Router();
  r.use(rateLimit({ windowMs: 15 * 60000, limit: 30 }));
  const ok = (v, n) => typeof v === 'string' && v.length >= n && v.length < 200;
  r.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!ok(email, 5) || !email.includes('@') || !ok(password, 8)) return res.status(400).json({ error: 'Valid email and 8+ char password required' });
    if ((await db.query('SELECT id FROM customers WHERE email=?', [email.toLowerCase()])).length) return res.status(409).json({ error: 'Email already registered' });
    const [c] = await db.query('INSERT INTO customers (name,email,phone,password_hash) VALUES (?,?,?,?) RETURNING id', [name || '', email.toLowerCase(), phone || '', await bcrypt.hash(password, 10)]);
    auth.setCookie(res, { id: c.id, role: 'customer' }); res.json({ ok: true });
  });
  const login = (table, role) => async (req, res) => {
    const { email, password } = req.body;
    const [u] = ok(email, 3) ? await db.query(`SELECT * FROM ${table} WHERE email=?`, [email.toLowerCase()]) : [];
    if (!u || !ok(password, 1) || !(await bcrypt.compare(password, u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
    auth.setCookie(res, { id: u.id, role }); res.json({ ok: true, role });
  };
  r.post('/login', login('customers', 'customer'));
  r.post('/admin-login', login('admins', 'admin'));
  r.post('/logout', (_q, res) => { res.clearCookie('token'); res.json({ ok: true }); });
  r.get('/me', (req, res) => res.json({ user: req.user }));
  app.use('/api/auth', r);
};
