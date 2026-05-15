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

// Parse allowed origins from environment variables robustly
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174'
];

const parseOrigins = (envVar) => {
  if (!envVar) return;
  envVar.split(',').forEach(url => {
    let cleanUrl = url.trim();
    // Remove trailing slash if present
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (cleanUrl) allowedOrigins.push(cleanUrl);
  });
};

parseOrigins(process.env.FRONTEND_URL);
parseOrigins(process.env.ADMIN_FRONTEND_URL);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      // For development/debugging, we might want to just allow it, but let's be secure
      // If Vercel creates preview URLs, we might need a regex
      // Let's allow any vercel.app domain for now to prevent these issues
      if (origin.endsWith('.vercel.app')) {
         return callback(null, true);
      }
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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

// Test Email Setup (SMTP)
app.get('/api/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({ error: 'SMTP_USER or SMTP_PASS is missing in environment!' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const testEmail = req.query.email || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"Health Forge Test" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: 'Health Forge Email Test Successful! ✅',
      text: 'If you are reading this, your SMTP email configuration is perfectly working!',
      html: '<h2 style="color:#0FCEDC;">⚕️ Health Forge</h2><p>If you are reading this, your SMTP email configuration is perfectly working! 🎉</p>',
    });

    res.json({ success: true, message: `Test email sent to ${testEmail}!`, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code || null,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health Forge API is running 🏥' });
});

// Initialize DB and Start server
const initializeDatabase = require('./config/init-db');

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🏥 Health Forge API running on http://localhost:${PORT}`);
  });
});
