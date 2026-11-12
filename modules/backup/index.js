const { TABLES, check } = require('./validate');
exports.name = 'backup';
exports.mount = (app, { db, cfg, auth }) => {
  // Admin accounts are not included. Image files stay in storage; backups keep their URLs.
  app.get('/api/admin/backup.json', auth.requireAdmin, async (_q, res) => {
    const tables = {}; for (const t of Object.keys(TABLES)) tables[t] = await db.query(`SELECT * FROM ${t}`);
    res.attachment(`backup-${new Date().toISOString().slice(0, 10)}.json`).json({ version: 1, created: new Date().toISOString(), tables });
  });
  app.post('/api/admin/restore', auth.requireAdmin, async (req, res) => {
    const b = req.body.backup, err = check(b); if (err) return res.status(400).json({ error: err });
    const counts = Object.fromEntries(Object.entries(b.tables).map(([t, r]) => [t, r.length]));
    if (!req.body.confirm) return res.json({ applied: false, counts, warning: 'Restoring will REPLACE all current data in these tables. Download a fresh backup first.' });
    for (const [t, rows] of Object.entries(b.tables)) {
      await db.query(`DELETE FROM ${t}`);
      for (const r of rows) { const k = Object.keys(r); await db.query(`INSERT INTO ${t} (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`, k.map((x) => r[x])); }
      if (cfg.databaseUrl && TABLES[t]) await db.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT MAX(id) FROM ${t}),1))`);
    }
    res.json({ applied: true, counts });
  });
};
