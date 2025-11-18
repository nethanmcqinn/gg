import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * Convert Cloudinary URL to force JPEG format (PDFKit only supports JPEG/PNG)
 * @param {string} url - Original image URL
 * @returns {string} Modified URL with JPEG format
 */
function convertToJpegUrl(url) {
  if (!url) return url;
  
  // If it's a Cloudinary URL, force JPEG format
  if (url.includes('cloudinary.com')) {
    // Insert format transformation before the image path
    // Example: https://res.cloudinary.com/demo/image/upload/sample.jpg
    // Becomes: https://res.cloudinary.com/demo/image/upload/f_jpg,w_200,h_200/sample.jpg
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_jpg,w_200,h_200,c_fit/${parts[1]}`;
    }
  }
  
  return url;
}

/**
 * Fetch image from URL as buffer
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} Image buffer
 */
async function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const jpegUrl = convertToJpegUrl(url);
    const protocol = jpegUrl.startsWith('https') ? https : http;
    
    protocol.get(jpegUrl, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate PDF receipt for an order
 * @param {Object} orderData - Order details
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateOrderReceipt(orderData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data in buffer
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .fillColor('#6ee7ff')
        .text('GGClicks', 50, 50);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Gaming Mouse Store', 50, 75)
        .text('Email: support@ggclicks.com', 50, 88)
        .moveDown();

      // Order Info Box
      doc
        .fontSize(16)
        .fillColor('#000000')
        .text('Order Receipt', 50, 120);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Order Number: ${orderData.orderNumber}`, 50, 145)
        .text(`Order Date: ${new Date(orderData.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, 50, 160)
        .text(`Status: ${orderData.status.toUpperCase()}`, 50, 175);

      // Divider
      doc
        .moveTo(50, 200)
        .lineTo(550, 200)
        .strokeColor('#dddddd')
        .stroke();

      // Customer Info
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Bill To:', 50, 220);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(orderData.shippingAddress.fullName, 50, 240)
        .text(orderData.shippingAddress.address, 50, 255)
        .text(`${orderData.shippingAddress.city}, ${orderData.shippingAddress.postalCode}`, 50, 270)
        .text(orderData.shippingAddress.country, 50, 285)
        .text(`Phone: ${orderData.shippingAddress.phone}`, 50, 300);

      // Payment Method
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Payment Method:', 350, 220);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(orderData.paymentMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 350, 240);

      // Items Table Header
      const tableTop = 340;
      doc
        .fontSize(10)
        .fillColor('#000000')
        .text('Item', 50, tableTop, { width: 250 })
        .text('Qty', 320, tableTop, { width: 50 })
        .text('Price', 390, tableTop, { width: 80 })
        .text('Total', 490, tableTop, { width: 80 });

      // Table Header Line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .strokeColor('#dddddd')
        .stroke();

      // Items
      let itemY = tableTop + 25;
      
      for (const [index, item] of orderData.orderItems.entries()) {
        const itemTotal = item.price * item.quantity;

        // Try to add product image if available
        if (item.image) {
          try {
            const imageBuffer = await fetchImage(item.image);
            doc.image(imageBuffer, 50, itemY, { width: 40, height: 40 });
          } catch (imageError) {
            console.error('Failed to load product image:', imageError);
            // Continue without image
          }
        }

        // Adjust text position if image was added
        const textX = item.image ? 100 : 50;
        const nameWidth = item.image ? 200 : 250;

        doc
          .fontSize(9)
          .fillColor('#333333')
          .text(item.name, textX, itemY, { width: nameWidth })
          .text(item.brand, textX, itemY + 12, { width: nameWidth })
          .fillColor('#666666')
          .text(item.quantity.toString(), 320, itemY, { width: 50 })
          .text(`$${item.price.toFixed(2)}`, 390, itemY, { width: 80 })
          .text(`$${itemTotal.toFixed(2)}`, 490, itemY, { width: 80, align: 'right' });

        itemY += 50; // Increased spacing for images

        // Add divider between items
        if (index < orderData.orderItems.length - 1) {
          doc
            .moveTo(50, itemY - 5)
            .lineTo(550, itemY - 5)
            .strokeColor('#eeeeee')
            .stroke();
        }
      }

      // Summary Section
      const summaryTop = itemY + 20;

      // Divider before summary
      doc
        .moveTo(50, summaryTop - 10)
        .lineTo(550, summaryTop - 10)
        .strokeColor('#dddddd')
        .stroke();

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Subtotal:', 390, summaryTop)
        .text(`$${orderData.itemsPrice.toFixed(2)}`, 490, summaryTop, { align: 'right' })
        .text('Shipping:', 390, summaryTop + 20)
        .text(orderData.shippingPrice === 0 ? 'FREE' : `$${orderData.shippingPrice.toFixed(2)}`, 490, summaryTop + 20, { align: 'right' })
        .text('Tax (10%):', 390, summaryTop + 40)
        .text(`$${orderData.taxPrice.toFixed(2)}`, 490, summaryTop + 40, { align: 'right' });

      // Total
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Total:', 390, summaryTop + 70)
        .fontSize(14)
        .fillColor('#6ee7ff')
        .text(`$${orderData.totalPrice.toFixed(2)}`, 490, summaryTop + 70, { align: 'right' });

      // Footer
      const footerY = doc.page.height - 100;
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text('Thank you for your purchase!', 50, footerY, { align: 'center', width: 500 })
        .text('For any questions, please contact support@ggclicks.com', 50, footerY + 15, { align: 'center', width: 500 });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
