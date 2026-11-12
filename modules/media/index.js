const fs = require('fs'), path = require('path'), crypto = require('crypto'), express = require('express');
exports.name = 'media';
const MAGIC = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/gif': [0x47, 0x49, 0x46], 'image/webp': [0x52, 0x49, 0x46, 0x46] };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
exports.mount = (app, { db, cfg, auth }) => {
  const dir = path.join(__dirname, '../../uploads'), remote = cfg.supabaseUrl && cfg.supabaseKey;
  app.use('/uploads', express.static(dir));
  app.get('/api/admin/media', auth.requireAdmin, async (_q, res) => res.json(await db.query('SELECT * FROM media ORDER BY id DESC LIMIT 200')));
  app.post('/api/admin/media', auth.requireAdmin, async (req, res) => {
    const { data, type } = req.body, buf = Buffer.from(String(data || ''), 'base64');
    if (!EXT[type] || buf.length < 10 || buf.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Use a JPG, PNG, WebP or GIF under 4 MB' });
    if (!MAGIC[type].every((b, i) => buf[i] === b)) return res.status(400).json({ error: 'File content does not match its type' });
    const name = crypto.randomBytes(8).toString('hex') + '.' + EXT[type]; let url;
    if (remote) {
      const r = await fetch(`${cfg.supabaseUrl}/storage/v1/object/${cfg.supabaseBucket}/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${cfg.supabaseKey}`, 'Content-Type': type }, body: buf });
      if (!r.ok) return res.status(502).json({ error: 'Storage upload failed: ' + (await r.text()).slice(0, 200) });
      url = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.supabaseBucket}/${name}`;
    } else { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), buf); url = '/uploads/' + name; }
    const [m] = await db.query('INSERT INTO media (url,filename,type,size) VALUES (?,?,?,?) RETURNING id', [url, name, type, buf.length]);
    res.json({ id: m.id, url, storage: remote ? 'supabase' : 'local (lost on free hosts when they restart)' });
  });
};
