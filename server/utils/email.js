const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// ─── SMTP Transporter ───────────────────────────────────────
// Uses Gmail SMTP by default. For other providers, change SMTP_HOST/SMTP_PORT.
// Gmail requires an "App Password" (not your regular password):
//   1. Enable 2FA on your Google account
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Generate an app password for "Mail"
//   4. Use that 16-char password as SMTP_PASS in .env

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️  SMTP_USER or SMTP_PASS not set in .env — emails will be skipped.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: { user, pass },
    // Connection timeout settings to avoid hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify connection on startup
  transporter.verify((err) => {
    if (err) {
      console.error('❌ SMTP connection failed:', err.message);
    } else {
      console.log('✅ SMTP connected — emails ready via', host);
    }
  });

  return transporter;
};

const transporter = createTransporter();

// ─── PDF Invoice Generator ──────────────────────────────────
const createInvoicePDF = (orderDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const isManual = orderDetails.status === 'manual_verification';

      // Header
      doc.fillColor('#0FCEDC')
         .fontSize(24)
         .text('Health Forge', { align: 'center' })
         .moveDown();

      doc.fillColor('#333333')
         .fontSize(10)
         .text('123 Surgical Avenue, Medical District', { align: 'center' })
         .text('support@healthforge.com | +91 9876543210', { align: 'center' })
         .moveDown(2);

      // Invoice Details
      doc.fontSize(16).text('INVOICE', { underline: true });
      doc.fontSize(10)
         .text(`Order ID: ${orderDetails.order_id}`, { continued: true })
         .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.text(`Status: ${isManual ? 'Pending Bank Transfer Verification' : 'Paid Successfully'}`);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 350, tableTop, { width: 50, align: 'center' });
      doc.text('Price', 400, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 480, tableTop, { width: 70, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.font('Helvetica');
      
      let currentY = tableTop + 25;

      // Table Rows
      orderDetails.items.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        
        doc.text(item.name, 50, currentY, { width: 280 });
        doc.text(item.quantity.toString(), 350, currentY, { width: 50, align: 'center' });
        doc.text(`Rs. ${parseFloat(item.price).toLocaleString('en-IN')}`, 400, currentY, { width: 80, align: 'right' });
        doc.text(`Rs. ${itemTotal.toLocaleString('en-IN')}`, 480, currentY, { width: 70, align: 'right' });
        
        currentY += 20;
      });

      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 15;

      // Totals
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 380, currentY, { width: 80, align: 'right' });
      doc.text(`Rs. ${orderDetails.subtotal.toLocaleString('en-IN')}`, 480, currentY, { width: 70, align: 'right' });
      currentY += 20;

      doc.text('GST (18%):', 380, currentY, { width: 80, align: 'right' });
      doc.text(`Rs. ${orderDetails.gstAmount.toLocaleString('en-IN')}`, 480, currentY, { width: 70, align: 'right' });
      currentY += 20;

      doc.fontSize(12).fillColor('#0FCEDC');
      doc.text('Total Amount:', 380, currentY, { width: 80, align: 'right' });
      doc.text(`Rs. ${orderDetails.totalAmount.toLocaleString('en-IN')}`, 480, currentY, { width: 70, align: 'right' });
      
      currentY += 40;
      doc.fillColor('#333333').fontSize(10).font('Helvetica');

      // Bank Details for Manual Orders
      if (isManual) {
        doc.rect(50, currentY, 500, 100).fillAndStroke('#fff3cd', '#ffc107');
        doc.fillColor('#856404').font('Helvetica-Bold')
           .text('Bank Transfer Instructions', 60, currentY + 10);
        
        doc.font('Helvetica').fontSize(9)
           .text(`Please transfer exactly Rs. ${orderDetails.totalAmount.toLocaleString('en-IN')} to the following account:`, 60, currentY + 30)
           .text('Account Name: Health Forge Surgicals', 60, currentY + 45)
           .text('Account Number: 50200012345678', 60, currentY + 55)
           .text('IFSC Code: HDFC0001234', 60, currentY + 65)
           .text('Bank: HDFC Bank, Chandigarh Branch', 60, currentY + 75)
           .text('Once transferred, your order will be verified and dispatched within 24 hours.', 60, currentY + 85);
      }

      // Footer
      doc.fontSize(8).fillColor('gray')
         .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─── Send Order Receipt via SMTP ────────────────────────────
const sendOrderReceipt = async (userEmail, orderDetails) => {
  if (!transporter) {
    console.warn('⚠️  SMTP not configured. Skipping email for order:', orderDetails.order_id);
    return;
  }

  try {
    // Generate PDF invoice
    const pdfBuffer = await createInvoicePDF(orderDetails);
    const isManual = orderDetails.status === 'manual_verification';

    const fromName = process.env.SMTP_FROM_NAME || 'Health Forge';
    const fromEmail = process.env.SMTP_USER;

    // Build HTML email body
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0B1120, #111827); padding: 32px; text-align: center;">
          <h1 style="color: #0FCEDC; margin: 0; font-size: 28px;">⚕️ Health Forge</h1>
          <p style="color: #9CA3AF; margin: 8px 0 0; font-size: 14px;">Surgical Equipment Store</p>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 8px;">
            ${isManual ? '📋 Order Received — Bank Transfer Pending' : '✅ Payment Successful!'}
          </h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            ${isManual 
              ? `Your order <strong>#${orderDetails.order_id}</strong> has been received. Please complete the bank transfer as per the instructions in the attached invoice PDF.`
              : `Your payment for order <strong>#${orderDetails.order_id}</strong> was successful. Your order will be dispatched shortly.`
            }
          </p>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Order ID</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0FCEDC;">#${orderDetails.order_id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Items</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${orderDetails.items.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Subtotal</td>
                <td style="padding: 8px 0; text-align: right; color: #1e293b;">₹${orderDetails.subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">GST (18%)</td>
                <td style="padding: 8px 0; text-align: right; color: #1e293b;">₹${orderDetails.gstAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #1e293b; font-weight: 700; font-size: 16px;">Total</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: #0FCEDC;">₹${orderDetails.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <p style="color: #64748b; font-size: 13px;">📎 Your detailed PDF invoice is attached to this email.</p>
        </div>

        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Health Forge — Premium Surgical Equipment</p>
          <p style="margin: 4px 0 0;">support@healthforge.com</p>
        </div>
      </div>
    `;

    const plainText = isManual 
      ? `Hello,\n\nThank you for your order with Health Forge!\n\nYour order #${orderDetails.order_id} has been received. Please find your detailed invoice and bank transfer instructions attached to this email as a PDF.\n\nOnce we receive the bank transfer, your order will be dispatched.\n\nBest regards,\nThe Health Forge Team`
      : `Hello,\n\nThank you for your order with Health Forge!\n\nYour payment for order #${orderDetails.order_id} was successful. Please find your detailed PDF receipt attached to this email.\n\nYour order will be dispatched shortly.\n\nBest regards,\nThe Health Forge Team`;

    // Send email via SMTP
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject: `Invoice — Health Forge Order #${orderDetails.order_id}`,
      text: plainText,
      html: htmlContent,
      attachments: [
        {
          filename: `HealthForge_Invoice_${orderDetails.order_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ],
    });

    console.log('✅ Invoice email sent to:', userEmail, '| MessageID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send invoice email:', error.message);
    // Log full error for debugging but don't crash
    if (error.code) console.error('   Error code:', error.code);
    if (error.responseCode) console.error('   SMTP response code:', error.responseCode);
  }
};

module.exports = { sendOrderReceipt };
