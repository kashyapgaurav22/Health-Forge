const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function reset() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'kashyapgaurav22@gmail.com']);
  console.log('Password reset to admin123');
  
  // Also check it immediately
  const res = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['kashyapgaurav22@gmail.com']);
  const isValid = await bcrypt.compare('admin123', res.rows[0].password_hash);
  console.log('Verification check:', isValid);
  
  pool.end();
}
reset();
