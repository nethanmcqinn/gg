import nodemailer from 'nodemailer';
import { generateOrderReceipt } from './pdf.js';

let transporter = null;

export function configureEmail() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailPassword) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env');
  }
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
  
  return transporter;
}

export async function sendVerificationEmail(email, token) {
  if (!transporter) configureEmail();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify your GGClicks account',
    html: `
      <h2>Welcome to GGClicks!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background: #6ee7ff; color: #0b0d10; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button doesn't work, copy this link: ${verificationUrl}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email, token) {
  if (!transporter) configureEmail();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Reset your GGClicks password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background: #6ee7ff; color: #0b0d10; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If the button doesn't work, copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendOrderConfirmationEmail(email, orderDetails) {
  if (!transporter) configureEmail();
  
  const { orderNumber, orderItems, shippingAddress, totalPrice, itemsPrice, shippingPrice, taxPrice } = orderDetails;
  
  // Generate PDF receipt
  const pdfBuffer = await generateOrderReceipt(orderDetails);
  
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        ${item.name} (${item.brand})
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
        ₱${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6ee7ff;">Thank you for your order!</h2>
        <p>Your order has been successfully placed and is being processed.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total:</strong> ₱${totalPrice.toFixed(2)}</p>
        </div>

        <h3>Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₱${itemsPrice.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Shipping:</strong> ${shippingPrice === 0 ? 'FREE' : '₱' + shippingPrice.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Tax:</strong> ₱${taxPrice.toFixed(2)}</p>
          <p style="margin: 10px 0; font-size: 18px; color: #6ee7ff;"><strong>Total:</strong> ₱${totalPrice.toFixed(2)}</p>
        </div>

        <h3>Shipping Address</h3>
        <p style="margin: 5px 0;">${shippingAddress.fullName}</p>
        <p style="margin: 5px 0;">${shippingAddress.address}</p>
        <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.postalCode}</p>
        <p style="margin: 5px 0;">${shippingAddress.country}</p>
        <p style="margin: 5px 0;">Phone: ${shippingAddress.phone}</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p><strong>📎 Your receipt is attached as a PDF.</strong></p>
          <p>We'll send you another email when your order ships.</p>
          <p>Questions? Contact us at ${process.env.GMAIL_USER}</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `receipt-${orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

export async function sendOrderStatusUpdateEmail(email, orderDetails) {
  if (!transporter) configureEmail();
  
  const { orderNumber, status, totalPrice, orderItems, shippingAddress, itemsPrice, shippingPrice, taxPrice, paymentMethod, createdAt } = orderDetails;
  
  // Generate PDF receipt with updated status
  const pdfBuffer = await generateOrderReceipt(orderDetails);
  
  const statusMessages = {
    pending: 'Your order is pending confirmation',
    processing: 'Your order is being processed 📦',
    shipped: 'Your order has been shipped! 🚚',
    delivered: 'Your order has been delivered! 🎉',
    cancelled: 'Your order has been cancelled'
  };

  const statusColors = {
    pending: '#ff9800',
    processing: '#2196f3',
    shipped: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336'
  };
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Order Update - ${orderNumber} - ${status.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6ee7ff;">Order Status Update</h2>
        <div style="background: ${statusColors[status] || '#f5f5f5'}; padding: 20px; border-radius: 5px; margin: 20px 0; color: white;">
          <h3 style="margin-top: 0;">${statusMessages[status] || 'Order status updated'}</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Order Total:</strong> ₱${totalPrice.toFixed(2)}</p>
        </div>
        
        ${status === 'shipped' ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>📦 Your order is on its way!</strong></p>
            <p style="margin: 5px 0; color: #1976d2;">Expected delivery: 3-5 business days</p>
          </div>
        ` : ''}
        
        ${status === 'delivered' ? `
          <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #388e3c;"><strong>🎉 Thank you for shopping with GGClicks!</strong></p>
            <p style="margin: 5px 0; color: #388e3c;">We hope you enjoy your new gaming mouse!</p>
          </div>
        ` : ''}
        
        <p>Track your order or view details in your account dashboard.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p><strong>📎 Updated receipt attached as PDF.</strong></p>
          <p>Questions? Contact us at ${process.env.GMAIL_USER}</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `receipt-${orderNumber}-${status}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}
