require('dotenv').config();
const pool = require('./config/db');

const run = async () => {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
    console.log('✅ Added role to users table');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY, 
        code VARCHAR(50) UNIQUE NOT NULL, 
        discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100), 
        is_active BOOLEAN DEFAULT true, 
        expires_at TIMESTAMP, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created coupons table');
    
    // Create an initial active coupon for testing
    await pool.query(`
      INSERT INTO coupons (code, discount_percentage) 
      VALUES ('WELCOME10', 10) 
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Created test coupon WELCOME10');

    // Make kashyapgaurav22 account an admin for testing if it exists
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'kashyapgaurav22@gmail.com'");
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
};

run();
