const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard configuration for Gmail
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOrderReceipt = async (userEmail, orderDetails) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing. Skipping email receipt for order:', orderDetails.order_id);
    return;
  }

  const isManual = orderDetails.status === 'manual_verification';
  
  // Create an HTML table of items
  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #0FCEDC; text-align: center;">Health Forge</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">Order Receipt</h3>
        <p><strong>Order ID:</strong> ${orderDetails.order_id}</p>
        <p><strong>Status:</strong> ${isManual ? 'Pending Bank Transfer Verification' : 'Paid Successfully'}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="padding: 10px; text-align: right;">₹${orderDetails.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">GST (18%):</td>
              <td style="padding: 10px; text-align: right;">₹${orderDetails.gstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="font-size: 1.1em; color: #0FCEDC;">
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total Paid:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">₹${orderDetails.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        ${isManual ? `
          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h4 style="margin-top: 0; color: #856404;">Bank Transfer Instructions</h4>
            <p>Please transfer exactly <strong>₹${orderDetails.totalAmount.toLocaleString('en-IN')}</strong> to the following account to begin processing your order:</p>
            <ul style="list-style: none; padding-left: 0;">
              <li><strong>Account Name:</strong> Health Forge Surgicals</li>
              <li><strong>Account Number:</strong> 50200012345678</li>
              <li><strong>IFSC Code:</strong> HDFC0001234</li>
              <li><strong>Bank:</strong> HDFC Bank, Chandigarh Branch</li>
            </ul>
            <p style="margin-bottom: 0;">Once transferred, your order will be verified and dispatched within 24 hours.</p>
          </div>
        ` : `
          <p style="margin-top: 30px; text-align: center; color: #28a745;">
            ✅ Payment received securely. Your order will be dispatched shortly!
          </p>
        `}
      </div>
      <p style="text-align: center; font-size: 0.8em; color: #6c757d; margin-top: 20px;">
        &copy; ${new Date().getFullYear()} Health Forge. All rights reserved.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Health Forge" <' + process.env.SMTP_USER + '>',
      to: userEmail,
      subject: `Order Receipt - ${orderDetails.order_id}`,
      html: htmlContent,
    });
    console.log('✅ Email receipt sent to:', userEmail);
  } catch (error) {
    console.error('❌ Failed to send email receipt:', error);
  }
};

module.exports = { sendOrderReceipt };
