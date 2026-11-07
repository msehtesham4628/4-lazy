import { getDB, saveDB } from './db.ts';
import { EmailLog, Order } from '../types/index.ts';

export function sendEmail({
  to,
  subject,
  type,
  htmlContent
}: {
  to: string;
  subject: string;
  type: EmailLog['type'];
  htmlContent: string;
}) {
  const db = getDB();
  const log: EmailLog = {
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    to,
    subject,
    type,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    previewHtml: htmlContent
  };

  db.emailLogs.unshift(log);
  if (db.emailLogs.length > 200) {
    db.emailLogs.pop();
  }
  saveDB();
  return log;
}

export function sendWelcomeEmail(name: string, email: string) {
  const html = `
    <div style="background-color: #0c0c0e; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="letter-spacing: 4px; font-size: 26px; margin: 0; color: #f4f4f5;">4 LAZY</h1>
        <p style="font-size: 11px; letter-spacing: 2px; color: #a1a1aa; margin-top: 4px;">LESS EFFORT. MORE STYLE.</p>
      </div>
      <div style="background-color: #18181b; padding: 28px; border: 1px solid #27272a;">
        <h2 style="font-size: 18px; margin-top: 0; font-weight: 600;">Welcome to the Vanguard, ${name}.</h2>
        <p style="color: #a1a1aa; line-height: 1.6; font-size: 14px;">
          Your 4 LAZY account is now active. You have unlocked access to exclusive drop notifications, order tracking, and private archivals.
        </p>
        <div style="margin: 24px 0; padding: 16px; background-color: #0c0c0e; border: 1px dashed #E5A914; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #a1a1aa; letter-spacing: 1.5px;">YOUR WELCOME PRIVILEGE</p>
          <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #E5A914; letter-spacing: 2px;">FIRST4L</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #71717a;">Flat ₹500 off on your first order above ₹2,499</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #71717a;">
        &copy; ${new Date().getFullYear()} 4 LAZY INC. ALL RIGHTS RESERVED.
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to 4 LAZY | Less Effort. More Style.',
    type: 'welcome',
    htmlContent: html
  });
}

export function sendOtpEmail(email: string, otp: string) {
  const html = `
    <div style="background-color: #0c0c0e; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="letter-spacing: 4px; font-size: 24px; margin: 0;">4 LAZY</h1>
      </div>
      <div style="background-color: #18181b; padding: 24px; border: 1px solid #27272a; text-align: center;">
        <h2 style="font-size: 16px; margin-top: 0; color: #f4f4f5;">Email Verification Code</h2>
        <p style="color: #a1a1aa; font-size: 13px;">Please use the one-time code below to verify your email address:</p>
        <div style="display: inline-block; padding: 14px 28px; background-color: #0c0c0e; border: 1px solid #3f3f46; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #E5A914; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #71717a; font-size: 11px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, please disregard.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${otp} is your 4 LAZY verification code`,
    type: 'email_otp',
    htmlContent: html
  });
}

export function sendOrderConfirmationEmail(order: Order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 13px;">
        <strong style="color: #f4f4f5;">${item.productTitle}</strong><br/>
        <span style="color: #a1a1aa; font-size: 11px;">Color: ${item.colorName} · Size: ${item.size} · Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 13px; text-align: right; color: #f4f4f5;">
        ₹${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="background-color: #0c0c0e; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="letter-spacing: 4px; font-size: 26px; margin: 0;">4 LAZY</h1>
        <p style="font-size: 11px; letter-spacing: 2px; color: #a1a1aa; margin-top: 4px;">ORDER CONFIRMATION</p>
      </div>
      <div style="background-color: #18181b; padding: 24px; border: 1px solid #27272a;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <span style="font-size: 11px; color: #a1a1aa; text-transform: uppercase;">Order Number</span>
            <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #f4f4f5;">${order.orderNumber}</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #a1a1aa; text-transform: uppercase;">Payment</span>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #10b981; font-weight: 600;">VERIFIED (${order.payment.provider.toUpperCase()})</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #3f3f46;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #a1a1aa;">
            <span>Subtotal</span>
            <span>₹${order.subtotal.toLocaleString()}</span>
          </div>
          ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #10b981;">
            <span>Discount</span>
            <span>-₹${order.discount.toLocaleString()}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #a1a1aa;">
            <span>Shipping</span>
            <span>${order.shippingFee === 0 ? 'COMPLIMENTARY' : `₹${order.shippingFee}`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 16px; font-weight: 700; color: #f4f4f5;">
            <span>Total Paid</span>
            <span style="color: #E5A914;">₹${order.total.toLocaleString()}</span>
          </div>
        </div>

        <div style="margin-top: 24px; padding: 14px; background-color: #0c0c0e; border: 1px solid #27272a; font-size: 12px; color: #a1a1aa;">
          <strong style="color: #f4f4f5;">Delivery Address:</strong><br/>
          ${order.shippingAddress.fullName}<br/>
          ${order.shippingAddress.street}${order.shippingAddress.apartment ? ', ' + order.shippingAddress.apartment : ''}<br/>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pinCode}<br/>
          Phone: ${order.shippingAddress.phone}
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Order Confirmed: ${order.orderNumber} | 4 LAZY`,
    type: 'order_confirmation',
    htmlContent: html
  });
}

export function sendShippingUpdateEmail(order: Order) {
  const html = `
    <div style="background-color: #0c0c0e; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="letter-spacing: 4px; font-size: 24px; margin: 0;">4 LAZY</h1>
        <p style="font-size: 11px; letter-spacing: 2px; color: #a1a1aa; margin-top: 4px;">SHIPMENT UPDATE</p>
      </div>
      <div style="background-color: #18181b; padding: 24px; border: 1px solid #27272a;">
        <h2 style="font-size: 16px; margin-top: 0;">Status: <span style="color: #E5A914;">${order.status.toUpperCase()}</span></h2>
        <p style="color: #a1a1aa; font-size: 13px;">Your order <strong>${order.orderNumber}</strong> has been updated.</p>

        ${order.tracking ? `
        <div style="margin: 20px 0; padding: 16px; background-color: #0c0c0e; border: 1px solid #3f3f46;">
          <div style="font-size: 11px; color: #a1a1aa;">COURIER PARTNER</div>
          <div style="font-size: 14px; font-weight: 600; color: #f4f4f5; margin-top: 2px;">${order.tracking.courierCompany}</div>
          <div style="font-size: 11px; color: #a1a1aa; margin-top: 10px;">TRACKING NUMBER</div>
          <div style="font-size: 15px; font-family: monospace; font-weight: 700; color: #E5A914; margin-top: 2px;">${order.tracking.trackingNumber}</div>
          ${order.tracking.estimatedDeliveryDate ? `
          <div style="font-size: 11px; color: #a1a1aa; margin-top: 10px;">ESTIMATED DELIVERY</div>
          <div style="font-size: 13px; color: #f4f4f5; margin-top: 2px;">${order.tracking.estimatedDeliveryDate}</div>` : ''}
        </div>` : ''}

        <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Track real-time status in your 4 LAZY customer account anytime.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customer.email,
    subject: `Shipment Update: Order ${order.orderNumber} is ${order.status}`,
    type: 'shipping_update',
    htmlContent: html
  });
}
