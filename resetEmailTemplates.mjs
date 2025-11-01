// This script resets and repopulates the Email templates in PocketBase
// Run with: node resetEmailTemplates.mjs

// Import PocketBase
import PocketBase from 'pocketbase';

// Create a new PocketBase instance with the correct remote URL
const pb = new PocketBase('https://backend-pocketbase.7za6uc.easypanel.host/');

// Email template enum (similar to WhatsApp templates)
const EmailTemplate = {
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_SHIPPED: 'order_shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  REQUEST_REVIEW: 'request_review',
  REFUND_CONFIRMATION: 'refund_confirmation',
  REORDER_REMINDER: 'reorder_reminder',
  ABANDONED_CART: 'abandoned_cart',
};

async function resetEmailTemplates() {
  try {
    console.log('Starting Email templates reset...');
    
    // First authenticate as admin
    console.log('Authenticating as admin...');
    try {
      await pb.admins.authWithPassword('nnirmal7107@gmail.com', 'Kamala@7107');
      console.log('Admin authentication successful');
    } catch (authError) {
      console.error('Admin authentication failed:', authError);
      throw new Error('Authentication failed. Cannot proceed without admin access.');
    }
    
    // Check if collection exists
    console.log('Checking if collection exists...');
    const collections = await pb.collections.getFullList();
    const templateCollectionExists = collections.some(c => c.name === 'email_templates');
    
    // Create collection if it doesn't exist
    if (!templateCollectionExists) {
      console.log('Creating email_templates collection...');
      await pb.collections.create({
        name: 'email_templates',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
          },
          {
            name: 'subject',
            type: 'text',
            required: true,
          },
          {
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'requiresAdditionalInfo',
            type: 'bool',
            required: true,
            default: false,
          },
          {
            name: 'additionalInfoLabel',
            type: 'text',
          },
          {
            name: 'additionalInfoPlaceholder',
            type: 'text',
          },
          {
            name: 'isActive',
            type: 'bool',
            required: true,
            default: true,
          },
          {
            name: 'description',
            type: 'text',
          },
        ],
      });
      console.log('Collection created successfully');
    } else {
      console.log('Collection already exists');
    }

    // Delete all existing templates
    console.log('Deleting existing templates...');
    try {
      const existingTemplates = await pb.collection('email_templates').getFullList();
      for (const template of existingTemplates) {
        await pb.collection('email_templates').delete(template.id);
      }
      console.log(`Deleted ${existingTemplates.length} existing templates`);
    } catch (err) {
      console.log('No existing templates to delete or error:', err);
    }

    // Default templates based on the EmailTemplate enum
    const defaultTemplates = [
      {
        name: EmailTemplate.ORDER_CONFIRMATION,
        subject: 'Your Order #{{orderId}} is Confirmed!',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Order Confirmation</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>Thank you for your order! We're pleased to confirm that we've received your order #{{orderId}}.</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Order Summary</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Order Date:</strong> {{orderDate}}</p>
      <p><strong>Total Amount:</strong> ₹{{amount}}</p>
    </div>
    <h3>Items Ordered</h3>
    <div>{{productDetails}}</div>
    <p>We'll send you another email once your order has been shipped. If you have any questions, please don't hesitate to contact our customer service team.</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: false,
        isActive: true,
        description: 'Sent when an order is confirmed',
      },
      {
        name: EmailTemplate.PAYMENT_SUCCESS,
        subject: 'Payment Successful for Order #{{orderId}}',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Payment Successful</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>Great news! Your payment of ₹{{amount}} for order #{{orderId}} has been successfully processed.</p>
    <div style="background-color: #f0f7e6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #5cb85c;">
      <h3 style="margin-top: 0; color: #5cb85c;">Payment Details</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Amount Paid:</strong> ₹{{amount}}</p>
      <p><strong>Payment Date:</strong> {{orderDate}}</p>
    </div>
    <p>We're now preparing your order for shipment. You'll receive another email with tracking information once your order ships.</p>
    <p>Thank you for your purchase!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: false,
        isActive: true,
        description: 'Sent when payment is successful',
      },
      {
        name: EmailTemplate.PAYMENT_FAILED,
        subject: 'Action Required: Payment Failed for Order #{{orderId}}',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #d9534f;">Payment Failed</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>We're sorry to inform you that we couldn't process your payment of ₹{{amount}} for order #{{orderId}}.</p>
    <div style="background-color: #fdf7f7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
      <h3 style="margin-top: 0; color: #d9534f;">Payment Details</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Amount:</strong> ₹{{amount}}</p>
      <p><strong>Status:</strong> Failed</p>
    </div>
    <p>This could be due to insufficient funds, incorrect card details, or your bank declining the transaction.</p>
    <p>Please click the button below to try again with a different payment method:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{retryUrl}}" style="background-color: #5cb85c; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Retry Payment</a>
    </div>
    <p>If you continue to experience issues, please contact our customer support team for assistance.</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Retry Payment URL',
        additionalInfoPlaceholder: 'https://example.com/retry-payment',
        isActive: true,
        description: 'Sent when payment fails',
      },
      {
        name: EmailTemplate.ORDER_SHIPPED,
        subject: 'Your Order #{{orderId}} Has Been Shipped!',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Order Shipped</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>Great news! Your order #{{orderId}} has been shipped and is on its way to you.</p>
    <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #5bc0de;">
      <h3 style="margin-top: 0; color: #5bc0de;">Shipping Details</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Carrier:</strong> {{carrier}}</p>
      <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
    </div>
    <p>You can track your package using the link below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{trackingLink}}" style="background-color: #5bc0de; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
    </div>
    <p>If you have any questions about your shipment, please don't hesitate to contact our customer service team.</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Tracking Link & Carrier',
        additionalInfoPlaceholder: 'https://tracking.com/123456,FedEx',
        isActive: true,
        description: 'Sent when order is shipped',
      },
      {
        name: EmailTemplate.OUT_FOR_DELIVERY,
        subject: 'Your Order #{{orderId}} is Out for Delivery Today!',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Out for Delivery</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>We're excited to let you know that your order #{{orderId}} is out for delivery today!</p>
    <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #5bc0de;">
      <h3 style="margin-top: 0; color: #5bc0de;">Delivery Details</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Expected Delivery:</strong> Today</p>
    </div>
    <p>Please ensure that someone is available to receive the package. If you miss the delivery, the carrier may leave a note with instructions for rescheduling or pickup.</p>
    <p>We hope you enjoy your purchase!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: false,
        isActive: true,
        description: 'Sent when order is out for delivery',
      },
      {
        name: EmailTemplate.ORDER_DELIVERED,
        subject: 'Your Order #{{orderId}} Has Been Delivered!',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Order Delivered</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>Great news! Your order #{{orderId}} has been delivered.</p>
    <div style="background-color: #f0f7e6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #5cb85c;">
      <h3 style="margin-top: 0; color: #5cb85c;">Delivery Confirmation</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Delivery Date:</strong> Today</p>
    </div>
    <p>We hope you're happy with your purchase! If you have a moment, we'd love to hear your feedback.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{feedbackLink}}" style="background-color: #5cb85c; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Share Your Feedback</a>
    </div>
    <p>If you have any questions or concerns about your order, please don't hesitate to contact our customer service team.</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Feedback Link',
        additionalInfoPlaceholder: 'https://example.com/feedback',
        isActive: true,
        description: 'Sent when order is delivered',
      },
      {
        name: EmailTemplate.REQUEST_REVIEW,
        subject: 'We Value Your Opinion on Your Recent Purchase',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Your Opinion Matters</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>We hope you're enjoying your recent purchase from order #{{orderId}}.</p>
    <p>Your feedback is incredibly valuable to us and helps other customers make informed decisions. Would you take a moment to share your experience?</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reviewLink}}" style="background-color: #f0ad4e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Write a Review</a>
    </div>
    <p>It only takes a minute, and your insights help us improve our products and services.</p>
    <p>Thank you for being a valued customer!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Review Link',
        additionalInfoPlaceholder: 'https://example.com/review',
        isActive: true,
        description: 'Sent to request a review',
      },
      {
        name: EmailTemplate.REFUND_CONFIRMATION,
        subject: 'Refund Processed for Order #{{orderId}}',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Refund Processed</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>We've processed your refund of ₹{{refundAmount}} for order #{{orderId}}.</p>
    <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #5bc0de;">
      <h3 style="margin-top: 0; color: #5bc0de;">Refund Details</h3>
      <p><strong>Order Number:</strong> {{orderId}}</p>
      <p><strong>Refund Amount:</strong> ₹{{refundAmount}}</p>
      <p><strong>Refund Date:</strong> {{orderDate}}</p>
    </div>
    <p>The refunded amount should appear in your account within 5-7 business days, depending on your bank's processing time.</p>
    <p>If you have any questions about your refund, please don't hesitate to contact our customer service team.</p>
    <p>Thank you for your patience and understanding.</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Refund Amount',
        additionalInfoPlaceholder: '500',
        isActive: true,
        description: 'Sent when refund is processed',
      },
      {
        name: EmailTemplate.REORDER_REMINDER,
        subject: 'Time to Reorder Your Favorite Products?',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Time to Reorder?</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>It's been {{daysSinceDelivery}} days since you received your order #{{orderId}}.</p>
    <p>We hope you've been enjoying your purchase! If you're running low on supplies, now is the perfect time to reorder.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reorderLink}}" style="background-color: #5cb85c; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reorder Now</a>
    </div>
    <p>As a valued customer, we want to make sure you never run out of your favorite products.</p>
    <p>Thank you for your continued support!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Reorder Link & Days Since Delivery',
        additionalInfoPlaceholder: 'https://example.com/reorder,30',
        isActive: true,
        description: 'Sent as a reminder to reorder',
      },
      {
        name: EmailTemplate.ABANDONED_CART,
        subject: 'Your Cart is Waiting - Complete Your Purchase',
        content: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
    <h1 style="color: #4a6f8a;">Your Cart is Waiting</h1>
  </div>
  <div style="padding: 20px;">
    <p>Dear {{customerName}},</p>
    <p>We noticed you left some items in your shopping cart.</p>
    <p>Your selections are still saved and ready for checkout. Complete your purchase before the items sell out!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{cartUrl}}" style="background-color: #f0ad4e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Your Purchase</a>
    </div>
    <p>If you experienced any issues during checkout or have questions about the products, our customer service team is here to help.</p>
    <p>Thank you for considering us for your purchase!</p>
    <p>Best regards,<br>The Team</p>
  </div>
  <div style="background-color: #4a6f8a; color: white; padding: 15px; text-align: center; font-size: 12px;">
    <p>© 2025 Your Company. All rights reserved.</p>
  </div>
</body>
</html>`,
        requiresAdditionalInfo: true,
        additionalInfoLabel: 'Cart URL',
        additionalInfoPlaceholder: 'https://example.com/cart/123',
        isActive: true,
        description: 'Sent for abandoned carts',
      },
    ];

    // Create default templates in PocketBase
    console.log('Creating new templates...');
    let createdCount = 0;
    for (const template of defaultTemplates) {
      try {
        await pb.collection('email_templates').create(template);
        createdCount++;
        console.log(`Created template: ${template.name}`);
      } catch (err) {
        console.error(`Error creating template ${template.name}:`, err);
        // Continue with other templates
      }
    }

    console.log(`Successfully created ${createdCount} templates`);
    console.log('Email templates reset completed successfully!');
    
  } catch (err) {
    console.error('Error resetting Email templates:', err);
  }
}

// Execute the function
resetEmailTemplates().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
});
