// Usage: node scripts/create-admin.js you@example.com 'a-strong-password'
const cfg = require('../config'), db = require('../database/db'), bcrypt = require('bcryptjs');
(async () => {
  const [email, pw] = process.argv.slice(2);
  if (!email || !pw || pw.length < 10) return console.log('Usage: node scripts/create-admin.js EMAIL PASSWORD(10+ chars)');
  await db.init(cfg);
  await db.query('INSERT INTO admins (email,password_hash) VALUES (?,?)', [email.toLowerCase(), await bcrypt.hash(pw, 10)]);
  console.log('Admin created'); process.exit(0);
})();
