const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const csvParser = require('csv-parser');
const fs = require('fs');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleAuth');

const router = express.Router();

// Multer config for memory storage (for both images and CSV)
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth to all routes in this file
router.use(authMiddleware);

// ==========================================
// ANALYTICS
// ==========================================
router.get('/analytics', checkPermission('view_analytics'), async (req, res) => {
  try {
    const period = req.query.period || 'all'; // today, 7d, 30d, all
    
    // Build date filter
    let dateFilter = '';
    let dateFilterRevenue = '';
    if (period === 'today') {
      dateFilter = "AND o.created_at >= CURRENT_DATE";
      dateFilterRevenue = "AND created_at >= CURRENT_DATE";
    } else if (period === '7d') {
      dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
      dateFilterRevenue = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === '30d') {
      dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'";
      dateFilterRevenue = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const totalRevenueQuery = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' ${dateFilterRevenue}`);
    const totalOrdersQuery = await pool.query(`SELECT COUNT(*) as count FROM orders o WHERE 1=1 ${dateFilter}`);
    const activeOrdersQuery = await pool.query(`SELECT COUNT(*) as count FROM orders o WHERE status NOT IN ('delivered', 'failed', 'cancelled') ${dateFilter}`);
    const totalProductsQuery = await pool.query("SELECT COUNT(*) as count FROM products");
    const lowStockQuery = await pool.query("SELECT COUNT(*) as count FROM products WHERE stock < 10");
    const totalUsersQuery = await pool.query("SELECT COUNT(*) as count FROM users");

    // Day-wise revenue data for charts
    let revenueDataQuery;
    if (period === 'today') {
      revenueDataQuery = await pool.query(`
        SELECT TO_CHAR(created_at, 'HH24:00') as label, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders
        FROM orders WHERE status = 'paid' AND created_at >= CURRENT_DATE
        GROUP BY TO_CHAR(created_at, 'HH24:00')
        ORDER BY label
      `);
    } else if (period === '7d') {
      revenueDataQuery = await pool.query(`
        SELECT TO_CHAR(created_at, 'DD Mon') as label, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders
        FROM orders WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at)
      `);
    } else if (period === '30d') {
      revenueDataQuery = await pool.query(`
        SELECT TO_CHAR(created_at, 'DD Mon') as label, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders
        FROM orders WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at)
      `);
    } else {
      revenueDataQuery = await pool.query(`
        SELECT TO_CHAR(created_at, 'Mon YYYY') as label, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders
        FROM orders WHERE status = 'paid'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `);
    }

    res.json({
      revenue: parseFloat(totalRevenueQuery.rows[0].total),
      totalOrders: parseInt(totalOrdersQuery.rows[0].count),
      activeOrders: parseInt(activeOrdersQuery.rows[0].count),
      totalProducts: parseInt(totalProductsQuery.rows[0].count),
      lowStock: parseInt(lowStockQuery.rows[0].count),
      totalUsers: parseInt(totalUsersQuery.rows[0].count),
      revenueData: revenueDataQuery.rows.map(row => ({ 
        name: row.label, 
        revenue: parseFloat(row.revenue),
        orders: parseInt(row.orders)
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// ORDERS
// ==========================================
router.get('/orders', checkPermission('manage_orders'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, o.razorpay_order_id, 
             o.delivery_pin, o.status_updated_at,
             u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/orders/:id/status', checkPermission('manage_orders'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    // Auto-generate 6-digit delivery PIN when marking as out_for_delivery
    let deliveryPin = null;
    if (status === 'out_for_delivery') {
      deliveryPin = String(Math.floor(100000 + Math.random() * 900000));
      await pool.query(
        'UPDATE orders SET status = $1, delivery_pin = $2, status_updated_at = NOW() WHERE id = $3',
        [status, deliveryPin, id]
      );
    } else {
      await pool.query(
        'UPDATE orders SET status = $1, status_updated_at = NOW() WHERE id = $2',
        [status, id]
      );
    }
    
    res.json({ message: 'Order status updated successfully', delivery_pin: deliveryPin });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/orders/:id', checkPermission('manage_orders'), async (req, res) => {
  try {
    const { id } = req.params;
    const orderQuery = await pool.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1
    `, [id]);
    
    if (orderQuery.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    const itemsQuery = await pool.query(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1
    `, [id]);
    
    res.json({ ...orderQuery.rows[0], items: itemsQuery.rows });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// PRODUCTS
// ==========================================
router.post('/products', checkPermission('manage_products'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category_slug, stock } = req.body;
    let image_url = req.body.image_url;

    // If an image file was uploaded, upload it to Cloudinary
    if (req.file) {
      const uploadFromBuffer = (req) => {
        return new Promise((resolve, reject) => {
          let cld_upload_stream = cloudinary.uploader.upload_stream(
            { folder: "health_forge_products" },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
        });
      };
      const result = await uploadFromBuffer(req);
      image_url = result.secure_url;
    }
    
    // Find category ID
    let categoryResult = await pool.query('SELECT id FROM categories WHERE slug = $1', [category_slug]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid category slug' });
    }
    const category_id = categoryResult.rows[0].id;

    await pool.query(
      `INSERT INTO products (name, description, price, image_url, category_id, stock)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, description, price, image_url, category_id, stock || 0]
    );
    res.status(201).json({ message: 'Product created successfully', image_url });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/products/bulk-upload', checkPermission('manage_products'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded' });
  }

  const results = [];
  try {
    const stream = streamifier.createReadStream(req.file.buffer);
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let successCount = 0;
        let failCount = 0;
        
        for (const row of results) {
          try {
            const { name, description, price, image_url, category_slug, stock } = row;
            if (!name || !price || !category_slug) {
              failCount++;
              continue; // Skip invalid rows
            }
            
            // Find category ID
            let categoryResult = await pool.query('SELECT id FROM categories WHERE slug = $1', [category_slug]);
            let category_id = null;
            if (categoryResult.rows.length > 0) {
              category_id = categoryResult.rows[0].id;
            } else {
              // Create category if it doesn't exist
              const newCat = await pool.query(
                'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
                [category_slug.replace(/-/g, ' '), category_slug]
              );
              category_id = newCat.rows[0].id;
            }

            await pool.query(
              `INSERT INTO products (name, description, price, image_url, category_id, stock)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
              [name, description, price, image_url || '', category_id, parseInt(stock) || 0]
            );
            successCount++;
          } catch (e) {
            failCount++;
            console.error('Row insert error:', e.message);
          }
        }
        res.json({ message: 'Bulk upload completed', successCount, failCount });
      });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Internal server error processing CSV' });
  }
});

router.put('/products/:id', checkPermission('manage_products'), upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_slug, stock } = req.body;
    let image_url = req.body.image_url;

    // If a new image file was uploaded, upload it to Cloudinary
    if (req.file) {
      const uploadFromBuffer = (req) => {
        return new Promise((resolve, reject) => {
          let cld_upload_stream = cloudinary.uploader.upload_stream(
            { folder: "health_forge_products" },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
        });
      };
      const result = await uploadFromBuffer(req);
      image_url = result.secure_url;
    }
    
    // Find category ID
    let categoryResult = await pool.query('SELECT id FROM categories WHERE slug = $1', [category_slug]);
    const category_id = categoryResult.rows.length > 0 ? categoryResult.rows[0].id : null;

    // Build update query dynamically depending on if image_url is provided
    if (image_url) {
      await pool.query(
        `UPDATE products 
         SET name = $1, description = $2, price = $3, image_url = $4, category_id = $5, stock = $6
         WHERE id = $7`,
        [name, description, price, image_url, category_id, stock, id]
      );
    } else {
      await pool.query(
        `UPDATE products 
         SET name = $1, description = $2, price = $3, category_id = $4, stock = $5
         WHERE id = $6`,
        [name, description, price, category_id, stock, id]
      );
    }
    res.json({ message: 'Product updated successfully', image_url });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/products/:id', checkPermission('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Cannot delete product. It may be linked to existing orders.' });
  }
});

// ==========================================
// USERS
// ==========================================
router.get('/users', checkPermission('manage_users'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const search = req.query.search || '';

    // Validate sort column
    const validSorts = ['created_at', 'name', 'email', 'total_spent', 'order_count'];
    const sortCol = validSorts.includes(sort) ? sort : 'created_at';

    let searchFilter = '';
    const params = [limit, offset];
    if (search) {
      searchFilter = `AND (u.name ILIKE $3 OR u.email ILIKE $3)`;
      params.push(`%${search}%`);
    }

    const countQuery = await pool.query(
      `SELECT COUNT(*) as total FROM users u WHERE 1=1 ${searchFilter}`,
      search ? [`%${search}%`] : []
    );

    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.role_id, u.created_at, r.name as role_name,
             COALESCE(os.order_count, 0)::INTEGER as order_count,
             COALESCE(os.total_spent, 0)::NUMERIC as total_spent
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as order_count, SUM(total_amount) as total_spent
        FROM orders GROUP BY user_id
      ) os ON u.id = os.user_id
      WHERE 1=1 ${searchFilter}
      ORDER BY ${sortCol === 'total_spent' ? 'os.total_spent' : sortCol === 'order_count' ? 'os.order_count' : 'u.' + sortCol} ${order}
      LIMIT $1 OFFSET $2
    `, params);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countQuery.rows[0].total),
        totalPages: Math.ceil(parseInt(countQuery.rows[0].total) / limit)
      }
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/users/:id/role', checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    
    // role is now role_id which links to roles table
    await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [role_id, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// ROLES
// ==========================================
router.get('/roles', checkPermission('manage_roles'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/roles', checkPermission('manage_roles'), async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name || !permissions) {
      return res.status(400).json({ message: 'Name and permissions required' });
    }
    const result = await pool.query(
      'INSERT INTO roles (name, permissions) VALUES ($1, $2) RETURNING *',
      [name, JSON.stringify(permissions)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/roles/:id', checkPermission('manage_roles'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    
    await pool.query(
      'UPDATE roles SET name = $1, permissions = $2 WHERE id = $3',
      [name, JSON.stringify(permissions), id]
    );
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/roles/:id', checkPermission('manage_roles'), async (req, res) => {
  try {
    const { id } = req.params;
    // Don't delete if users are assigned
    const check = await pool.query('SELECT count(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete role assigned to users' });
    }
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
