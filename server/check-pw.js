const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const res = await pool.query("SELECT password_hash FROM users WHERE id = 3");
  const isValid = await bcrypt.compare('password123', res.rows[0].password_hash);
  console.log('Password valid in script:', isValid);
  pool.end();
}
check();
