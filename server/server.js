// Force IPv4 globally - Render free tier doesn't support IPv6 outbound
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);

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
    const nodemailer = require('nodemailer');
    const dns = require('dns');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({ error: 'SMTP variables are missing in Render Environment!' });
    }
    
    // Manually resolve Gmail SMTP to IPv4
    const addresses = await dns.promises.resolve4('smtp.gmail.com');
    const ipv4Address = addresses[0];
    
    const transporter = nodemailer.createTransport({
      host: ipv4Address,
      port: 465,
      secure: true,
      tls: { servername: 'smtp.gmail.com' },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    
    await transporter.sendMail({
      from: '"Health Forge Test" <' + process.env.SMTP_USER + '>',
      to: process.env.SMTP_USER,
      subject: 'Health Forge Email Test Successful!',
      text: 'If you are reading this, your Render email configuration is perfectly working!',
    });

    res.json({ success: true, message: 'Test email sent to ' + process.env.SMTP_USER, resolvedIp: ipv4Address });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      response: error.response,
      command: error.command
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
