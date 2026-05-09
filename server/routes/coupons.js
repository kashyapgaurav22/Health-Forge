const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleAuth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// POST /api/coupons/validate (For checkout page)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Coupon code is required' });
    }

    const result = await pool.query(
      `SELECT id, code, discount_percentage, is_active, expires_at 
       FROM coupons WHERE code = UPPER($1)`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
    }

    const coupon = result.rows[0];

    if (!coupon.is_active) {
      return res.status(400).json({ valid: false, message: 'This coupon is no longer active' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    }

    res.json({
      valid: true,
      message: 'Coupon applied successfully!',
      discount_percentage: coupon.discount_percentage,
      code: coupon.code
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================
router.use(authMiddleware);

// GET /api/coupons
router.get('/', checkPermission('manage_coupons'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/coupons
router.post('/', checkPermission('manage_coupons'), async (req, res) => {
  try {
    const { code, discount_percentage, is_active, expires_at } = req.body;
    
    if (!code || !discount_percentage) {
      return res.status(400).json({ message: 'Code and discount percentage are required' });
    }

    await pool.query(
      `INSERT INTO coupons (code, discount_percentage, is_active, expires_at)
       VALUES (UPPER($1), $2, $3, $4)`,
      [code, discount_percentage, is_active !== false, expires_at || null]
    );
    
    res.status(201).json({ message: 'Coupon created successfully' });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === '23505') { // unique violation
      return res.status(409).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/coupons/:id
router.put('/:id', checkPermission('manage_coupons'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    await pool.query('UPDATE coupons SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', checkPermission('manage_coupons'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
