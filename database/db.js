// One interface for Postgres (production) and node:sqlite (local). Use ? placeholders; add RETURNING id on inserts.
const fs = require('fs'), path = require('path');
let impl, isPg = false;
async function init(cfg) {
  if (cfg.databaseUrl) {
    isPg = true; const { Pool } = require('pg');
    const pool = new Pool({ connectionString: cfg.databaseUrl, ssl: cfg.production ? { rejectUnauthorized: false } : undefined });
    impl = async (sql, p) => (await pool.query(sql.replace(/\?/g, (() => { let i = 0; return () => '$' + ++i; })()), p)).rows;
  } else {
    const { DatabaseSync } = require('node:sqlite'); const d = new DatabaseSync('local.sqlite');
    impl = async (sql, p) => d.prepare(sql).all(...p);
  }
  const pk = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  await impl('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)', []);
  const dir = path.join(__dirname, 'migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    if ((await impl('SELECT name FROM migrations WHERE name=?'.replace('?', isPg ? '$1' : '?'), [f])).length) continue;
    for (const stmt of fs.readFileSync(path.join(dir, f), 'utf8').replace(/{{PK}}/g, pk).split(';').map((s) => s.trim()).filter(Boolean)) await impl(stmt, []);
    await impl(isPg ? 'INSERT INTO migrations VALUES ($1)' : 'INSERT INTO migrations VALUES (?)', [f]);
    console.log('migrated', f);
  }
}
module.exports = { init, query: (s, p = []) => impl(s, p) };
