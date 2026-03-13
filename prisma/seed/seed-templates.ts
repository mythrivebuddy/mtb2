import { prisma } from "@/lib/prisma";

async function main() {
  const templates = [
    {
      templateId: "forget-password",
      subject: "Reset Your Password",
      description: "Email sent when a user requests to reset their password.",
      htmlContent: `
        <p>Hello {{username}},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="{{resetUrl}}">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
    },
    {
      templateId: "verification-mail",
      subject: "Verify Your Email Address",
      description:
        "Email sent to users to verify their email address after registration.",
      htmlContent: `
        <p>Welcome {{username}},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
        <p><a href="{{verificationUrl}}">Verify Email</a></p>
        <p>If you did not create an account, please disregard this message.</p>
      `,
    },
    {
      templateId: "contactus-mail",
      subject: "Thank You for Contacting Us",
      description:
        "Acknowledgement email sent to users who submit the contact-us form.",
      htmlContent: `
        <p>Hi {{username}},</p>
        <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
      `,
    },
    {
      templateId: "order-placed",
      subject: "Order Confirmed! 🎉 Your order #{{orderId}} is placed",
      description: "Email sent to user when an order is successfully placed.",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Thank you for your purchase</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #374151;">Hello <strong>{{username}}</strong>,</p>
            <p style="color: #6b7280;">Your order has been placed successfully and is being processed.</p>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">{{orderId}}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">{{orderDate}}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Amount</td>
                  <td style="padding: 8px 0; color: #16a34a; font-weight: 700; font-size: 16px; text-align: right;">{{totalAmount}}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: #dcfce7; color: #16a34a; padding: 3px 10px; border-radius: 999px; font-size: 13px; font-weight: 600;">{{status}}</span>
                  </td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Items Ordered</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">{{itemCount}} item(s)</td>
                </tr>
              </table>
            </div>

            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #9a3412; font-size: 14px;">
                🛍 <strong>Items:</strong> {{itemNames}}
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              You can view your order details and track your order status by visiting your account.
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="{{orderUrl}}" style="background: linear-gradient(135deg, #f97316, #ef4444); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                View My Orders
              </a>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 13px;">
              If you have any questions, feel free to contact our support team.
            </p>
            <p style="margin: 8px 0 0; color: #d1d5db; font-size: 12px;">
              © My Thrive Buddy. All rights reserved.
            </p>
          </div>
        </div>
      `,
    },

    {
      templateId: "spotlight-active",
      subject: "Your Spotlight is Now Active!",
      description: "Notification email when a user's spotlight goes live.",
      htmlContent: `
        <p>Congratulations {{username}},</p>
        <p>Your spotlight is now active! You can view it here:</p>
      `,
    },
    {
      templateId: "spotlight-applied",
      subject: "Spotlight Application Received",
      description: "Confirmation email sent when a user applies for spotlight.",
      htmlContent: `
        <p>Hi {{username}},</p>
        <p>We have received your application for the spotlight feature. Our team will review it and notify you after approval.</p>
        <p>Estimated Activation Date: {{insert_date}}</p>
      `,
    },
    {
      templateId: "prosperity-application",
      subject: "Prosperity Program Application Confirmation",
      description: "Confirmation email for prosperity program applications.",
      htmlContent: `
        <p>Hello {{username}},</p>
        <p>Thank you for applying to our Prosperity Program. We have received your application and will review it shortly.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
      `,
    },
    {
      templateId: "magic-box-shared",
      subject: "Someone Shared Magic Box Reward with You! 🎁",
      description:
        "Email sent when a user shares their magic box JP with another user.",
      htmlContent: `
        <p>Hello {{username}},</p>
        <p>Great news! {{senderName}} has shared their Magic Box with you!</p>
        <p>You have received {{jpAmount}} JP from their Magic Box.</p>
        <p>Want to thank them? Visit their profile:</p>
        <p><a href="{{profileUrl}}">View {{senderName}}'s Profile</a></p>
        <p>Keep spreading the joy!</p>
      `,
    },
    {
      templateId: "magic-box-sender",
      subject: "Magic Box Shared Successfully! 🎁",
      description:
        "Email sent to confirm when a user shares their magic box JP.",
      htmlContent: `
        <p>Hello {{username}},</p>
        <p>You've successfully shared your Magic Box with {{receiverName}}!</p>
        <p>You received {{jpAmount}} JP and shared {{sharedAmount}} JP with {{receiverName}}.</p>
        <p>Thank you for spreading joy in our community!</p>
      `,
    },
    {
      templateId: "user-added-to-accountability-hub-group",
      subject: "You've been added to the Accountability hub Group!",
      description:
        "Email sent when a user is added to an accountability hub group.",
      htmlContent: `
      <p>Hello {{userName}},</p>
      <p>You have been added as a member to the accountability hub group: <strong>{{groupName}}</strong>.</p>
      <p>Click the button below to view the group and get started on your goals:</p>
      <p style="padding: 10px 0;">
      <a 
        href="{{groupUrl}}" 
        style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-family: sans-serif;"
      >
        View Group
      </a>
      </p>
      <p>We're excited to have you on board!</p>
  `,
    },
  ];

  for (const tmpl of templates) {
    await prisma.emailTemplate.upsert({
      where: { templateId: tmpl.templateId },
      update: {
        subject: tmpl.subject,
        description: tmpl.description,
        htmlContent: tmpl.htmlContent.trim(),
      },
      create: tmpl,
    });
  }

  console.log("Seeded email templates successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
