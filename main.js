// Central controller: config -> database -> auto-discovered modules -> static files -> errors.
const fs = require('fs'), path = require('path');
const cfg = require('./config'), db = require('./database/db'), auth = require('./config/auth');
const express = require('express'), helmet = require('helmet'), cookieParser = require('cookie-parser'), rateLimit = require('express-rate-limit');

(async () => {
  await db.init(cfg);
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }), express.json({ limit: '1mb' }), cookieParser(), auth.attach);
  app.use('/api', rateLimit({ windowMs: 60000, limit: 120 }), auth.csrf);
  const ctx = { cfg, db, auth };
  // Any folder in /modules with an index.js exporting { name, mount(app, ctx) } is loaded automatically.
  for (const dir of fs.readdirSync(path.join(__dirname, 'modules'))) {
    const f = path.join(__dirname, 'modules', dir, 'index.js');
    if (!fs.existsSync(f)) continue;
    const m = require(f); m.mount(app, ctx); console.log('module loaded:', m.name);
  }
  // Keep-alive endpoint: pinged by an uptime monitor; also touches the database so it never idles.
  app.get('/health', async (_q, res) => { try { await db.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } });
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });
  app.listen(cfg.port, () => console.log(`Store running on ${cfg.publicUrl} (port ${cfg.port})`));
})().catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
