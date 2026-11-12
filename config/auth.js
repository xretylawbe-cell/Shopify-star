const jwt = require('jsonwebtoken');
const cfg = require('./index');
const sign = (u) => jwt.sign(u, cfg.jwtSecret, { expiresIn: '7d' });
const setCookie = (res, u) => res.cookie('token', sign(u), { httpOnly: true, sameSite: 'strict', secure: cfg.production, maxAge: 7 * 864e5 });
function attach(req, _res, next) { try { req.user = jwt.verify(req.cookies.token, cfg.jwtSecret); } catch { req.user = null; } next(); }
// CSRF: SameSite=strict cookie + required custom header on state-changing requests (forces CORS preflight)
function csrf(req, res, next) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('x-requested-with') !== 'fetch') return res.status(403).json({ error: 'CSRF check failed' });
  next();
}
const requireAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });
module.exports = { setCookie, attach, csrf, requireAdmin };
