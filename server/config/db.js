const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const requiresSSL = connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('render.com');

const pool = new Pool({
  connectionString: connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = pool;
