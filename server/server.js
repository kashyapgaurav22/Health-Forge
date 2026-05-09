// Force IPv4 globally - Render free tier doesn't support IPv6 outbound
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);

// Root route so Render doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Health Forge API is live! 🏥 Use /api/health to check status.');
});

// Debug
app.get('/api/debug', (req, res) => {
  res.json({
    dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    keyId: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}... (Length: ${process.env.RAZORPAY_KEY_ID.length})` : 'Missing',
    keySecretLength: process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0
  });
});

// Test Email Setup
app.get('/api/test-email', async (req, res) => {
  try {
    const { Resend } = require('resend');
    
    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ error: 'RESEND_API_KEY is missing in Render Environment!' });
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // We send to an arbitrary email, or if they have a test one they can pass it as a query param.
    // For free tier, they can ONLY send to the email they registered with Resend.
    const testEmail = req.query.email || 'test@example.com';

    const { data, error } = await resend.emails.send({
      from: 'Health Forge Test <onboarding@resend.dev>',
      to: testEmail,
      subject: 'Health Forge Email Test Successful!',
      text: 'If you are reading this, your Render email configuration with Resend is perfectly working!',
    });

    if (error) {
       return res.status(500).json({ success: false, error });
    }

    res.json({ success: true, message: `Test email sent! Response ID: ${data.id}`, note: "Remember, on Resend's free tier, you can only send emails to the exact email address you used to sign up for Resend." });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health Forge API is running 🏥' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Health Forge API running on http://localhost:${PORT}`);
});
