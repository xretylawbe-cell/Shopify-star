const fs = require('fs');
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const e = process.env;
if (e.NODE_ENV === 'production' && (!e.JWT_SECRET || e.JWT_SECRET.startsWith('change-me'))) throw new Error('Set a strong JWT_SECRET');
module.exports = {
  port: +e.PORT || 3000, databaseUrl: e.DATABASE_URL || '', jwtSecret: e.JWT_SECRET || 'dev-only-secret',
  paystackKey: e.PAYSTACK_SECRET_KEY || '', publicUrl: e.PUBLIC_URL || 'http://localhost:3000',
  supabaseUrl: (e.SUPABASE_URL || '').replace(/\/$/, ''), supabaseKey: e.SUPABASE_SERVICE_KEY || '', supabaseBucket: e.SUPABASE_BUCKET || 'products',
  production: e.NODE_ENV === 'production',
};
