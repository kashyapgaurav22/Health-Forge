const { Resend } = require('resend');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

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
         .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
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

const sendOrderReceipt = async (userEmail, orderDetails) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY missing. Skipping PDF email receipt for order:', orderDetails.order_id);
    return;
  }

  try {
    const pdfBuffer = await createInvoicePDF(orderDetails);
    const isManual = orderDetails.status === 'manual_verification';

    const textContent = isManual 
      ? `Hello,\n\nThank you for your order with Health Forge!\n\nYour order #${orderDetails.order_id} has been received. Please find your detailed invoice and bank transfer instructions attached to this email as a PDF.\n\nOnce we receive the bank transfer, your order will be dispatched.\n\nBest regards,\nThe Health Forge Team`
      : `Hello,\n\nThank you for your order with Health Forge!\n\nYour payment for order #${orderDetails.order_id} was successful. Please find your detailed PDF receipt attached to this email.\n\nYour order will be dispatched shortly.\n\nBest regards,\nThe Health Forge Team`;

    const { data, error } = await resend.emails.send({
      from: 'Health Forge <onboarding@resend.dev>',
      to: userEmail,
      subject: `Invoice - Health Forge Order ${orderDetails.order_id}`,
      text: textContent,
      attachments: [
        {
          filename: `HealthForge_Invoice_${orderDetails.order_id}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    if (error) {
      console.error('❌ Failed to send PDF invoice with Resend:', error);
    } else {
      console.log('✅ PDF invoice sent to:', userEmail, 'Response ID:', data.id);
    }
  } catch (error) {
    console.error('❌ Failed to send PDF invoice:', error);
  }
};

module.exports = { sendOrderReceipt };
