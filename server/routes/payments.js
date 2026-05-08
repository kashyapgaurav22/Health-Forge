const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { sendOrderReceipt } = require('../utils/email');
require('dotenv').config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order — Create a Razorpay order from the user's cart
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    // Get cart items with prices
    const cartResult = await pool.query(
      `SELECT ci.quantity, p.price, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    // Calculate subtotal and GST
    const subtotal = cartResult.rows.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gstAmount;

    // Create Razorpay order (amount in paise)
    let order;
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_XXXXXXXXXXXXXX' || !process.env.RAZORPAY_KEY_ID) {
      // Dummy mode
      order = {
        id: `order_dummy_${Date.now()}`,
        amount: Math.round(totalAmount * 100),
        currency: 'INR'
      };
    } else {
      order = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `order_${req.user.id}_${Date.now()}`,
        notes: {
          user_id: req.user.id.toString(),
          user_email: req.user.email,
        },
      });
    }

    // Save order in database
    const dbOrder = await pool.query(
      `INSERT INTO orders (user_id, total_amount, status, razorpay_order_id)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [req.user.id, totalAmount, order.id]
    );

    // Save order items
    for (const item of cartResult.rows) {
      const productResult = await pool.query(
        `SELECT ci.product_id, ci.quantity, p.price
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1 AND p.name = $2`,
        [req.user.id, item.name]
      );

      if (productResult.rows.length > 0) {
        const pi = productResult.rows[0];
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [dbOrder.rows[0].id, pi.product_id, pi.quantity, pi.price]
        );
      }
    }

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      db_order_id: dbOrder.rows[0].id,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order.' });
  }
});

// POST /api/payments/verify — Verify Razorpay payment signature
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details.' });
    }

    const isDummy = razorpay_order_id.startsWith('order_dummy_') || 
                    process.env.RAZORPAY_KEY_ID === 'rzp_test_XXXXXXXXXXXXXX' || 
                    !process.env.RAZORPAY_KEY_ID;

    if (!isDummy) {
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim())
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Update order status to failed
        await pool.query(
          `UPDATE orders SET status = 'failed' WHERE razorpay_order_id = $1`,
          [razorpay_order_id]
        );
        return res.status(400).json({ message: 'Payment verification failed.' });
      }
    }

    // Update order status to paid and return the order details
    const dbOrderQuery = await pool.query(
      `UPDATE orders SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE razorpay_order_id = $3
       RETURNING id, total_amount`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Clear the user's cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    if (dbOrderQuery.rows.length > 0) {
      // Fetch order details for the email receipt
      const orderItems = await pool.query(
        `SELECT p.name, oi.quantity, oi.price 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [dbOrderQuery.rows[0].id]
      );

    const totalAmountStr = dbOrderQuery.rows[0].total_amount;
    const totalAmount = parseFloat(totalAmountStr);
    const subtotal = Math.round(totalAmount / 1.18);
    const gstAmount = totalAmount - subtotal;

      // Send Email Receipt
      await sendOrderReceipt(req.user.email, {
        order_id: razorpay_order_id,
        status: 'paid',
        items: orderItems.rows,
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalAmount: totalAmount
      });
    }

    res.json({
      message: 'Payment verified successfully.',
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed.' });
  }
});

// POST /api/payments/create-manual-order — Create a manual bank transfer order
router.post('/create-manual-order', authMiddleware, async (req, res) => {
  try {
    // Get cart items with prices
    const cartResult = await pool.query(
      `SELECT ci.quantity, p.price, p.name, ci.product_id
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    // Calculate subtotal and GST
    const subtotal = cartResult.rows.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gstAmount;

    // Save order in database with manual verification status
    const dbOrder = await pool.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'manual_verification')
       RETURNING *`,
      [req.user.id, totalAmount]
    );

    // Save order items
    for (const item of cartResult.rows) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [dbOrder.rows[0].id, item.product_id, item.quantity, item.price]
      );
    }

    // Clear the user's cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // Send Email Receipt with Bank Details
    await sendOrderReceipt(req.user.email, {
      order_id: `MANUAL_${dbOrder.rows[0].id}`,
      status: 'manual_verification',
      items: cartResult.rows, // we can use cart items because they haven't been wiped in memory
      subtotal: subtotal,
      gstAmount: gstAmount,
      totalAmount: totalAmount
    });

    res.json({
      message: 'Order created for manual verification.',
      db_order_id: dbOrder.rows[0].id,
      amount: totalAmount
    });
  } catch (error) {
    console.error('Create manual order error:', error);
    res.status(500).json({ message: 'Failed to create manual order.' });
  }
});

module.exports = router;
