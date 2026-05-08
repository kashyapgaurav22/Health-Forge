const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = pool;
