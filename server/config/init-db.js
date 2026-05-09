const pool = require('./db');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking database schema...');

    // 1. Users table base column
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");

    // 2. Coupons table
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

    // Create test coupon
    await pool.query(`
      INSERT INTO coupons (code, discount_percentage) 
      VALUES ('WELCOME10', 10) 
      ON CONFLICT DO NOTHING
    `);

    // 3. Roles table for RBAC
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Add role_id to users
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL
    `);

    // 5. Insert default Admin role
    const adminRoleResult = await pool.query(`
      INSERT INTO roles (name, permissions)
      VALUES ('Admin', '["manage_users", "manage_roles", "manage_products", "manage_orders", "view_analytics", "manage_coupons"]')
      ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions
      RETURNING id
    `);
    const adminRoleId = adminRoleResult.rows[0].id;

    // 6. Migrate existing admin string roles to the new role_id
    await pool.query(`
      UPDATE users SET role_id = $1 WHERE role = 'admin' AND role_id IS NULL
    `, [adminRoleId]);

    // 7. Force reset admin password for production DB (NeonDB)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await pool.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE email = 'kashyapgaurav22@gmail.com'
    `, [passwordHash]);
    
    console.log('✅ Admin password forcefully reset to admin123 for production');

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw, let the app start even if migration fails partially
  }
};

module.exports = initializeDatabase;
