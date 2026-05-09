const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testLogin() {
  const email = 'kashyapgaurav22@gmail.com';
  const password = 'admin123';
  
  try {
    const result = await pool.query(`
      SELECT u.*, r.permissions 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password is valid:', isValid);
    console.log('User role:', user.role);
    console.log('Permissions:', user.permissions);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
testLogin();
