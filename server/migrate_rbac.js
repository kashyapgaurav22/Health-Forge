require('dotenv').config();
const pool = require('./config/db');

const run = async () => {
  try {
    // 1. Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created roles table');

    // 2. Add role_id to users if not exists
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL
    `);
    console.log('✅ Added role_id to users table');

    // 3. Insert default Admin role
    const adminRoleResult = await pool.query(`
      INSERT INTO roles (name, permissions)
      VALUES ('Admin', '["manage_users", "manage_roles", "manage_products", "manage_orders", "view_analytics", "manage_coupons"]')
      ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions
      RETURNING id
    `);
    const adminRoleId = adminRoleResult.rows[0].id;
    console.log('✅ Created/Updated Admin role with all permissions');

    // 4. Migrate existing 'admin' string roles to the new role_id
    await pool.query(`
      UPDATE users SET role_id = $1 WHERE role = 'admin'
    `, [adminRoleId]);
    console.log('✅ Migrated existing admin users to new role_id');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
};

run();
