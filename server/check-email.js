const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const res = await pool.query("SELECT email, length(email) FROM users WHERE id = 3");
  console.log('Email in DB:', JSON.stringify(res.rows[0].email));
  console.log('Length:', res.rows[0].length);
  pool.end();
}
check();
