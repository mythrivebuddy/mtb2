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
         <div style="background: linear-gradient(90deg, #3b82f6, #4f46e5); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
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
              <a href="{{orderUrl}}"  style="
       background: linear-gradient(90deg, #3b82f6, #4f46e5);
       color: white;
       padding: 12px 32px;
       border-radius: 8px;
       text-decoration: none;
       font-weight: 600;
       font-size: 15px;
       display: inline-block;
     ">
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
    {
      templateId: "challenge-joined-free",
      subject: "You're in! Start your {{challengeName}} challenge 🚀",
      description: "Sent when a user joins a free challenge.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
 
  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#f0fdf4;">
    <h1 style="margin:0;color:#166534;font-size:24px;">You're in! 🎉</h1>
    <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">Your challenge journey starts now</p>
  </div>
 
  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{username}}</strong>,</p>
    <p style="color:#4b5563;">You've successfully joined the challenge:</p>
    <h2 style="margin:8px 0 20px;color:#111827;font-size:20px;">{{challengeName}}</h2>
 
    <!-- CHALLENGE DETAILS -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Start Date</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{startDate}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Challenge Type</td>
          <td style="padding:6px 0;text-align:right;">
            <span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;">Free</span>
          </td>
        </tr>
      </table>
    </div>
 
    <p style="color:#374151;font-size:14px;">Show up daily, stay consistent, and you'll see real progress. We're excited to have you on this journey.</p>
 
    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{challengeUrl}}" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Start Challenge →
      </a>
    </div>
 
    <p style="color:#9ca3af;font-size:13px;">Need help? Just reply to this email — we've got you.</p>
  </div>
 
  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy. All rights reserved.</p>
  </div>
 
</div>
    `.trim(),
    },

    // ─────────────────────────────────────────────
    // 2. USER joins PAID challenge
    // ─────────────────────────────────────────────
    {
      templateId: "challenge-joined-paid",
      subject: "Payment confirmed ✅ You're in {{challengeName}}",
      description: "Sent when a user joins a paid challenge.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
 
  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#eff6ff;">
    <h1 style="margin:0;color:#1d4ed8;font-size:24px;">Payment Confirmed! 🎉</h1>
    <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">You're officially enrolled</p>
  </div>
 
  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hello <strong>{{username}}</strong>,</p>
    <p style="color:#4b5563;">Your spot in the challenge is confirmed:</p>
    <h2 style="margin:8px 0 20px;color:#111827;font-size:20px;">{{challengeName}}</h2>
 
    <!-- CHALLENGE DETAILS -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Start Date</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{startDate}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Challenge Type</td>
          <td style="padding:6px 0;text-align:right;">
            <span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;">Paid</span>
          </td>
        </tr>
      </table>
    </div>
 
    <!-- PAYMENT DETAILS -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:18px;border-radius:8px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">💳 Payment Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount Paid</td>
          <td style="padding:6px 0;color:#16a34a;font-weight:700;font-size:15px;text-align:right;">₹{{amount}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Transaction ID</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{transactionId}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Payment Method</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{paymentMethod}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{paymentDate}}</td>
        </tr>
      </table>
    </div>
 
    <p style="color:#374151;font-size:14px;">You're all set. Now the real work begins 💪</p>
 
    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{challengeUrl}}" style="background:#4f46e5;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Go to Challenge →
      </a>
    </div>
 
    <p style="color:#9ca3af;font-size:13px;">Keep this email for your payment reference.</p>
  </div>
 
  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy. All rights reserved.</p>
  </div>
 
</div>
    `.trim(),
    },

    // ─────────────────────────────────────────────
    // 3. COACH notified — FREE challenge participant joined
    // FIX: removed {{amount}} row (free = no payment info)
    // FIX: dashboardUrl → challengeUrl
    // ─────────────────────────────────────────────
    {
      templateId: "coach-user-joined-challenge",
      subject: "{{username}} joined your challenge 🎯",
      description: "Sent to coach when a participant joins a free challenge.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
 
  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#fff7ed;">
    <h1 style="margin:0;color:#c2410c;font-size:24px;">New Participant Joined 🎯</h1>
    <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">Your challenge community is growing</p>
  </div>
 
  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{coachName}}</strong>,</p>
    <p style="color:#4b5563;"><strong>{{username}}</strong> has joined your challenge:</p>
    <h2 style="margin:8px 0 20px;color:#111827;font-size:20px;">{{challengeName}}</h2>
 
    <!-- PARTICIPANT INFO -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">Participant Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Name</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{username}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{userEmail}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Challenge Type</td>
          <td style="padding:6px 0;text-align:right;">
            <span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;">Free</span>
          </td>
        </tr>
      </table>
    </div>
 
    <p style="color:#374151;font-size:14px;">Keep building momentum with your community 🚀</p>
 
    <!-- CTA — FIX: was {{dashboardUrl}}, now {{challengeUrl}} -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{challengeUrl}}" style="background:#f59e0b;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        View Participants →
      </a>
    </div>
 
    <p style="color:#9ca3af;font-size:13px;">Need help? Just reply to this email.</p>
  </div>
 
  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy. All rights reserved.</p>
  </div>
 
</div>
    `.trim(),
    },

    // ─────────────────────────────────────────────
    // 4. COACH notified — PAID challenge participant joined
    // FIX: dashboardUrl → transactionPageUrl (already correct in route.ts)
    // ─────────────────────────────────────────────
    {
      templateId: "coach-user-joined-paid-challenge",
      subject: "💰 New Paid Enrollment in {{challengeName}}",
      description: "Sent to coach when a user joins a paid challenge.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
 
  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#ecfdf5;">
    <h1 style="margin:0;color:#065f46;font-size:24px;">New Paid Enrollment 💰</h1>
    <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">Someone invested in your challenge</p>
  </div>
 
  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{coachName}}</strong>,</p>
    <p style="color:#4b5563;"><strong>{{username}}</strong> joined your challenge:</p>
    <h2 style="margin:8px 0 20px;color:#111827;font-size:20px;">{{challengeName}}</h2>
 
    <!-- PARTICIPANT INFO -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">Participant Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Name</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{username}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td>
          <td style="padding:6px 0;color:#111827;font-weight:600;font-size:14px;text-align:right;">{{userEmail}}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Challenge Type</td>
          <td style="padding:6px 0;text-align:right;">
            <span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;">Paid</span>
          </td>
        </tr>
      </table>
    </div>
 
    <!-- PAYMENT BREAKDOWN -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:18px;border-radius:8px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">💳 Payment Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Base Price</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">₹{{baseAmount}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Discount</td>
          <td style="padding:6px 0;color:#dc2626;font-size:14px;text-align:right;">− ₹{{discount}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Net Amount</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">₹{{netBase}}</td>
        </tr>
        <tr style="border-top:1px solid #dcfce7;">
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">GST</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">₹{{gst}}</td>
        </tr>
        <tr style="border-top:2px solid #16a34a;">
          <td style="padding:8px 0;color:#111827;font-weight:700;font-size:15px;">Total Paid (incl. GST)</td>
          <td style="padding:8px 0;color:#16a34a;font-weight:700;font-size:15px;text-align:right;">₹{{totalPaid}}</td>
        </tr>
      </table>
    </div>
 
    <!-- PLATFORM FEE + EARNING -->
    {{#if showEarnings}}
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">🏢 Your Earnings</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Platform Commission ({{commissionPercent}}% of ₹{{netBase}})</td>
          <td style="padding:6px 0;color:#dc2626;font-size:14px;text-align:right;">− ₹{{platformFee}}</td>
        </tr>
        <tr style="border-top:2px solid #e5e7eb;">
          <td style="padding:8px 0;color:#065f46;font-weight:700;font-size:15px;">Your Earnings</td>
          <td style="padding:8px 0;color:#16a34a;font-weight:700;font-size:16px;text-align:right;">₹{{coachEarning}}</td>
        </tr>
      </table>
      <p style="margin:10px 0 0;color:#9ca3af;font-size:12px;">
  GST is collected as a tax component and is not part of your earnings.
</p>
      <p style="margin:10px 0 0;color:#9ca3af;font-size:13px;">Payment Date: {{paymentDate}}</p>
    </div>
 {{/if}}
    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{transactionPageUrl}}" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        View Transactions →
      </a>
    </div>
 
    <p style="color:#9ca3af;font-size:13px;">Keep building momentum with your community 🚀</p>
  </div>
 
  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy. All rights reserved.</p>
  </div>
 
</div>
    `.trim(),
    },

    {
      templateId: "accountability-group-notes-updated",
      subject: "New Update in {{groupName}} Accountability Hub Group",
      description:
        "Email sent when group notes are updated in an accountability hub group.",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- HEADER -->
        <div style="padding: 28px; text-align: center; background: linear-gradient(90deg, #3b82f6, #4f46e5);">
       <h1 style="margin: 0; color: white; font-size: 24px;">Group Notes Updated</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
         Stay aligned. Stay accountable.
        </p>
      </div>

      <!-- BODY -->
      <div style="padding: 28px;">
       <p style="font-size: 15px; color: #374151;">Hello <strong>{{username}}</strong>,</p>

        <p style="color: #4b5563; font-size: 14px;">
           <strong>{{updatedBy}}</strong> has updated the group notes in your accountability group:
       </p>

    <h2 style="margin: 10px 0 20px; color: #111827; font-size: 20px;">
      {{groupName}}
    </h2>

    <!-- MESSAGE BOX -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        Group notes help everyone stay aligned, accountable, and focused on the goals that matter.
      </p>
    </div>

    <!-- CTA BUTTON -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{groupUrl}}" style="
        background: linear-gradient(90deg, #3b82f6, #4f46e5);
        color: white;
        padding: 14px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
        display: inline-block;
      ">
        View Group Notes →
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px;">
      Consistency builds progress. Make sure to review the updated notes and stay on track with your goals.
    </p>
  </div>

  <!-- FOOTER -->
  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
      You're receiving this because you're a member of the accountability group <strong>{{groupName}}</strong>.
    </p>
    <p style="margin: 6px 0 0; color: #d1d5db; font-size: 12px;">
      © My Thrive Buddy. All rights reserved.
    </p>
  </div>

</div>
`.trim(),
    },
    {
      templateId: "invoice-challenge",
      subject: "Your Invoice for {{challengeName}} 🎯",
      description: "Short invoice email for challenge purchase.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

  <div style="background:#4f46e5;color:white;padding:20px;text-align:center;">
    <h2 style="margin:0;">Challenge Invoice 🎯</h2>
  </div>

  <div style="padding:20px;">
    <p>Hello <strong>{{username}}</strong>,</p>

    <p>You’ve successfully joined:</p>
    <h3 style="margin:10px 0;color:#111827;">{{challengeName}}</h3>

    <div style="background:#f3f4f6;padding:12px;border-radius:8px;margin:16px 0;font-size:14px;">
      <p style="margin:0;"><strong>Invoice:</strong> {{invoiceNumber}}</p>
      <p style="margin:4px 0 0;"><strong>Order:</strong> {{orderId}}</p>
    </div>

    <p style="font-size:14px;color:#374151;">
      📎 Your invoice is attached.
    </p>
  </div>

  <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#9ca3af;">
    {{companyName}}
  </div>

</div>
  `.trim(),
    },
    {
      templateId: "invoice-mmp",
      subject: "Your Invoice for {{programName}} 📘",
      description: "Short invoice email for Mini Mastery Program purchase.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

  <div style="background:#059669;color:white;padding:20px;text-align:center;">
    <h2 style="margin:0;">Program Invoice 📘</h2>
  </div>

  <div style="padding:20px;">
    <p>Hello <strong>{{username}}</strong>,</p>

    <p>You’ve successfully enrolled in:</p>
    <h3 style="margin:10px 0;color:#111827;">{{programName}}</h3>

    <div style="background:#f3f4f6;padding:12px;border-radius:8px;margin:16px 0;font-size:14px;">
      <p style="margin:0;"><strong>Invoice:</strong> {{invoiceNumber}}</p>
      <p style="margin:4px 0 0;"><strong>Order:</strong> {{orderId}}</p>
    </div>

    <p style="font-size:14px;color:#374151;">
      📎 Your invoice is attached to this email.
    </p>
  </div>

  <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#9ca3af;">
    {{companyName}}
  </div>

</div>
  `.trim(),
    },
    {
      templateId: "invoice-store",
      subject: "Your Store Invoice 🛍",
      description: "Short invoice email for store purchase.",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

  <div style="background:#ea580c;color:white;padding:20px;text-align:center;">
    <h2 style="margin:0;">Store Invoice 🛍</h2>
  </div>

  <div style="padding:20px;">
    <p>Hello <strong>{{username}}</strong>,</p>

    <p>Your order has been successfully placed.</p>

    <div style="background:#f3f4f6;padding:12px;border-radius:8px;margin:16px 0;font-size:14px;">
      <p style="margin:0;"><strong>Invoice:</strong> {{invoiceNumber}}</p>
      <p style="margin:4px 0 0;"><strong>Order:</strong> {{orderId}}</p>
    </div>

    <p style="font-size:14px;color:#374151;">
      📎 Your invoice is attached for your records.
    </p>
  </div>

  <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#9ca3af;">
    {{companyName}}
  </div>

</div>
  `.trim(),
    },
    {
      templateId: "mmp-free-enrolled-user",
      subject: "You're in! {{programName}} is now unlocked 🚀",
      description: "Sent when a user enrolls in a FREE Mini Mastery Program",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#ecfdf5;">
    <h1 style="margin:0;color:#065f46;font-size:24px;">You're In! 🎉</h1>
    <p style="margin:6px 0 0;color:#4b5563;">Your free learning journey starts now</p>
  </div>

  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{username}}</strong>,</p>

    <p style="color:#4b5563;">You've successfully joined:</p>
    <h2 style="margin:10px 0 20px;color:#111827;">{{programName}}</h2>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0;color:#166534;font-size:14px;">
        ✅ Free access unlocked
      </p>
    </div>

    <p style="color:#374151;font-size:14px;">
      Show up daily, stay consistent, and build momentum 
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{programUrl}}" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
        Start Learning →
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy</p>
  </div>

</div>
`.trim(),
    },
    {
      templateId: "mmp-free-enrolled-creator",
      subject: "New learner joined {{programName}} 🎉",
      description:
        "Sent to creator when someone joins their FREE Mini Mastery Program",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#eff6ff;">
    <h1 style="margin:0;color:#1d4ed8;font-size:24px;">New Enrollment 🎉</h1>
    <p style="margin:6px 0 0;color:#4b5563;">Your program is gaining traction</p>
  </div>

  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{creatorName}}</strong>,</p>

    <p style="color:#4b5563;">
      <strong>{{username}}</strong> just joined your program:
    </p>

    <h2 style="margin:10px 0 20px;color:#111827;">{{programName}}</h2>

    <div style="background:#f9fafb;padding:14px;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0;color:#374151;font-size:14px;">
        💡 Free programs are powerful entry points—keep delivering value!
      </p>
    </div>

    <p style="color:#374151;font-size:14px;">
      Keep building momentum and impact 🚀
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{programUrl}}" style="background:#3b82f6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
        View Program →
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy</p>
  </div>

</div>
`.trim(),
    },
    {
      templateId: "mmp-free-enrolled-admin",
      subject: "{{username}} joined {{programName}} ({{creatorName}})",
      description:
        "Sent to admin when a user enrolls in a free Mini Mastery Program",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- HEADER -->
          <div style="padding:24px;text-align:center;background:#f1f5f9;">
            <h2 style="margin:0;color:#111827;font-size:20px;">New Program Enrollment</h2>
            <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Mini Mastery Program</p>
          </div>

          <!-- BODY -->
          <div style="padding:24px;">
            <p style="font-size:14px;color:#374151;">
              <strong>{{username}}</strong> has joined the program
              <strong>"{{programName}}"</strong> created by
              <strong>{{creatorName}}</strong>.
            </p>

            <!-- DETAILS -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:16px;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">User</p>
              <p style="margin:0 0 12px;font-size:14px;color:#111827;font-weight:600;">
                {{username}} ({{userEmail}})
              </p>

              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Program</p>
              <p style="margin:0 0 12px;font-size:14px;color:#111827;font-weight:600;">
                {{programName}}
              </p>

              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Creator</p>
              <p style="margin:0;font-size:14px;color:#111827;font-weight:600;">
                {{creatorName}}
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-top:24px;">
              <a href="{{programUrl}}" style="
                background:#111827;
                color:white;
                padding:12px 24px;
                border-radius:6px;
                text-decoration:none;
                font-size:14px;
                font-weight:600;
                display:inline-block;
              ">
                View Program →
              </a>
            </div>
          </div>

          <!-- FOOTER -->
          <div style="background:#f9fafb;padding:14px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy</p>
          </div>
          </div>
`.trim(),
    },
    {
      templateId: "mmp-paid-enrolled-creator",
      subject: "💰 New Paid Enrollment in {{programName}}",
      description: "Sent to creator when a user joins a paid MMP",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">

  <div style="padding:28px;text-align:center;background:#ecfdf5;">
    <h1 style="margin:0;color:#065f46;">New Paid Enrollment 💰</h1>
    <p style="color:#4b5563;">Someone invested in your program</p>
  </div>

  <div style="padding:28px;">
    <p>Hi <strong>{{creatorName}}</strong>,</p>

    <p><strong>{{username}}</strong> enrolled in:</p>
    <h2>{{programName}}</h2>

    <!-- PAYMENT BREAKDOWN -->
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:20px;">
      <h3>💳 Payment Breakdown</h3>

      <table style="width:100%;">
        <tr>
          <td>Base Price</td>
          <td style="text-align:right;">₹{{baseAmount}}</td>
        </tr>

        <tr>
          <td>Discount</td>
          <td style="text-align:right;color:#dc2626;">
            − ₹{{discount}}
          </td>
        </tr>

        <tr>
          <td>Net Amount</td>
          <td style="text-align:right;">₹{{netBase}}</td>
        </tr>

        <tr>
          <td>GST</td>
          <td style="text-align:right;">₹{{gst}}</td>
        </tr>

        <tr style="border-top:2px solid #16a34a;">
          <td><strong>Total Paid</strong></td>
          <td style="text-align:right;color:#16a34a;">
            <strong>₹{{totalPaid}}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- EARNINGS -->
    {{#if showEarnings}}
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:20px;">
      <h3>🏢 Your Earnings</h3>

      <table style="width:100%;">
        <tr>
          <td>Platform Fee ({{commissionPercent}}%) of ₹{{netBase}})</td>
          <td style="text-align:right;color:#dc2626;">
            − ₹{{platformFee}}
          </td>
        </tr>

        <tr style="border-top:2px solid #e5e7eb;">
          <td><strong>Your Earnings</strong></td>
          <td style="text-align:right;color:#16a34a;">
            <strong>₹{{creatorEarning}}</strong>
          </td>
        </tr>
      </table>

      <p style="font-size:12px;color:#9ca3af;margin-top:10px;">
        Commission is calculated after discount (on net amount).
        GST is excluded from earnings.
      </p>
    </div>

  </div>
</div>
{{/if}}
`.trim(),
    },
    {
      templateId: "mmp-paid-enrolled-admin",
      subject: "New MMP Purchase — {{programName}}",
      description: "Sent to admin when a paid MMP purchase happens",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">

  <div style="padding:24px;text-align:center;background:#f1f5f9;">
    <h2>New Paid Enrollment</h2>
    <p style="color:#6b7280;">Mini Mastery Program</p>
  </div>

  <div style="padding:24px;">

    <p><strong>{{username}}</strong> purchased:</p>
    <h3>{{programName}}</h3>

    <p>Creator: <strong>{{creatorName}}</strong></p>

    <!-- PAYMENT -->
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:16px;">
      <h3>💳 Payment Breakdown</h3>

      <table style="width:100%;">
        <tr>
          <td>Base Price</td>
          <td style="text-align:right;">₹{{baseAmount}}</td>
        </tr>

        <tr>
          <td>Discount</td>
          <td style="text-align:right;color:#dc2626;">
            − ₹{{discount}}
          </td>
        </tr>

        <tr>
          <td>Net Amount</td>
          <td style="text-align:right;">₹{{netBase}}</td>
        </tr>

        <tr>
          <td>GST</td>
          <td style="text-align:right;">₹{{gst}}</td>
        </tr>

        <tr style="border-top:2px solid #16a34a;">
          <td><strong>Total Paid</strong></td>
          <td style="text-align:right;color:#16a34a;">
            <strong>₹{{totalPaid}}</strong>
          </td>
        </tr>
      </table>
      
    </div>

    <!-- REVENUE SPLIT -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:20px;">
      <h3>🏢 Revenue Split</h3>

      <table style="width:100%;">
        <tr>
          <td>Platform Fee ({{commissionPercent}}%) of ₹{{netBase}})</td>
          <td style="text-align:right;color:#2563eb;">
            ₹{{platformFee}}
          </td>
        </tr>

        <tr>
          <td>Creator Earning</td>
          <td style="text-align:right;color:#16a34a;">
            ₹{{creatorEarning}}
          </td>
        </tr>

        <tr style="border-top:2px solid #e5e7eb;">
          <td><strong>Platform Revenue</strong></td>
          <td style="text-align:right;color:#2563eb;">
            <strong>₹{{platformEarning}}</strong>
          </td>
        </tr>
      </table>

      <p style="font-size:12px;color:#9ca3af;margin-top:10px;">
        Commission is calculated on net amount (after discount).
        GST is not included in revenue.
      </p>
    </div>

    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
      Payment Date: {{paymentDate}} <br/>
      Transaction ID: {{transactionId}}
    </p>

  </div>
</div>
`.trim(),
    },
    {
      templateId: "challenge-joined-admin-free",
      subject: "{{username}} joined {{challengeName}} Challenge",
      description: "Admin email for  free challenge join enrollmet of user",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;padding:20px;">

  <h2 style="margin:0 0 10px;">New Free Challenge Enrollment</h2>

  <p style="font-size:14px;color:#374151;">
    <strong>{{username}}</strong> joined 
    <strong>{{challengeName}}</strong>
  </p>

  <div style="background:#f9fafb;padding:12px;border-radius:6px;margin-top:12px;">
    <p style="margin:0;font-size:13px;color:#6b7280;">User</p>
    <p style="margin:0;font-weight:600;">{{username}} ({{userEmail}})</p>

    <p style="margin:10px 0 0;font-size:13px;color:#6b7280;">Creator</p>
    <p style="margin:0;font-weight:600;">{{creatorName}}</p>

    <p style="margin:10px 0 0;font-size:13px;color:#6b7280;">Type</p>
    <p style="margin:0;font-weight:600;color:#16a34a;">Free</p>
  </div>

</div>
`.trim(),
    },
    // paid challenge admin template
    {
      templateId: "challenge-joined-admin-paid",
      subject: "New Challenge Purchase — {{challengeName}}",
      description: "Admin email for paid challenge enrollment",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">

  <div style="padding:24px;text-align:center;background:#f1f5f9;">
    <h2>New Paid Challenge Enrollment</h2>
    <p style="color:#6b7280;">Challenge</p>
  </div>

  <div style="padding:24px;">

    <p><strong>{{username}}</strong> purchased:</p>
    <h3>{{challengeName}}</h3>

    <p>Creator: <strong>{{creatorName}}</strong></p>

    <!-- PAYMENT -->
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:16px;">
      <h3>💳 Payment Breakdown</h3>

      <table style="width:100%;">
        <tr>
          <td>Base Price</td>
          <td style="text-align:right;">₹{{baseAmount}}</td>
        </tr>

        <tr>
          <td>Discount</td>
          <td style="text-align:right;color:#dc2626;">− ₹{{discount}}</td>
        </tr>

        <tr>
          <td>Net Amount</td>
          <td style="text-align:right;">₹{{netBase}}</td>
        </tr>

        <tr>
          <td>GST</td>
          <td style="text-align:right;">₹{{gst}}</td>
        </tr>

        <tr style="border-top:2px solid #16a34a;">
          <td><strong>Total Paid</strong></td>
          <td style="text-align:right;color:#16a34a;">
            <strong>₹{{totalPaid}}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- REVENUE -->
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:20px;">
      <h3>🏢 Revenue Split</h3>

      <table style="width:100%;">
        <tr>
          <td>Platform Fee ({{commissionPercent}}%)</td>
          <td style="text-align:right;">₹{{platformFee}}</td>
        </tr>

        <tr>
          <td>Creator Earning</td>
          <td style="text-align:right;color:#16a34a;">₹{{creatorEarning}}</td>
        </tr>

        <tr style="border-top:2px solid #e5e7eb;">
          <td><strong>Platform Revenue</strong></td>
          <td style="text-align:right;">₹{{platformEarning}}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
      Payment Date: {{paymentDate}} <br/>
      Transaction ID: {{transactionId}}
    </p>

  </div>
</div>
`.trim(),
    },
    {
      templateId: "store-order-seller",
      subject: "💰 New Purchase — {{productName}}",
      description: "Sent to seller when a product is purchased",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
 
  <!-- HEADER -->
  <div style="padding:28px;text-align:center;background:#ecfdf5;">
    <h1 style="margin:0;color:#065f46;font-size:24px;">New Sale 💰</h1>
    <p style="margin:6px 0 0;color:#4b5563;font-size:15px;">Someone purchased your product</p>
  </div>
 
  <!-- BODY -->
  <div style="padding:28px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>{{sellerName}}</strong>,</p>

    <p style="color:#4b5563;"><strong>{{username}}</strong> purchased:</p>
    <h2 style="margin:8px 0 20px;color:#111827;font-size:20px;">{{productName}}</h2>

    <!-- PAYMENT BREAKDOWN -->
    {{#if isGP}}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:18px;border-radius:8px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">💰 GP Payment</h3>
        <p style="margin:0;font-size:15px;">
          Total Received: <strong>{{totalPaid}} GP</strong>
        </p>
      </div>
    {{else}}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:18px;border-radius:8px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">💳 Payment Breakdown</h3>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Base Price</td>
            <td style="text-align:right;">{{currencySymbol}}{{baseAmount}}</td>
          </tr>

          <tr style="border-top:1px solid #dcfce7;">
            <td style="padding:6px 0;color:#6b7280;">Discount</td>
            <td style="text-align:right;color:#dc2626;">− {{currencySymbol}}{{discount}}</td>
          </tr>

          <tr style="border-top:1px solid #dcfce7;">
            <td style="padding:6px 0;color:#6b7280;">Net Amount</td>
            <td style="text-align:right;">{{currencySymbol}}{{netBase}}</td>
          </tr>

          <tr style="border-top:1px solid #dcfce7;">
            <td style="padding:6px 0;color:#6b7280;">GST</td>
            <td style="text-align:right;">{{currencySymbol}}{{gst}}</td>
          </tr>

          <tr style="border-top:2px solid #16a34a;">
            <td style="padding:8px 0;font-weight:700;">Total Paid</td>
            <td style="text-align:right;color:#16a34a;font-weight:700;">
              {{currencySymbol}}{{totalPaid}}
            </td>
          </tr>
        </table>
      </div>
    {{/if}}

    <!-- EARNINGS -->
    {{#if isGP}}
      <!-- skip earnings for GP -->
    {{else}}
      {{#if showEarnings}}
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;color:#374151;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">🏢 Your Earnings</h3>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Platform Fee ({{commissionPercent}}% of {{currencySymbol}}{{netBase}})</td>
            <td style="text-align:right;color:#dc2626;">− {{currencySymbol}}{{platformFee}}</td>
          </tr>

          <tr style="border-top:2px solid #e5e7eb;">
            <td style="padding:8px 0;color:#065f46;font-weight:700;">Your Earnings</td>
            <td style="text-align:right;color:#16a34a;font-weight:700;">
              {{currencySymbol}}{{creatorEarning}}
            </td>
          </tr>
        </table>

        <p style="margin:10px 0 0;color:#9ca3af;font-size:12px;">
          GST is collected as tax and is not part of your earnings.
        </p>
      </div>
      {{/if}}
    {{/if}}

    <!-- META -->
    <p style="font-size:13px;color:#6b7280;">
      Payment Date: {{paymentDate}} <br/>
      Transaction ID: {{transactionId}}
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="{{programUrl}}" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        View Orders →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:13px;">Keep growing your store 🚀</p>
  </div>

  <!-- FOOTER -->
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© My Thrive Buddy. All rights reserved.</p>
  </div>

</div>
`,
    },
    {
      templateId: "store-order-admin",
      subject: "🛒 New Store Order",
      description: "Sent to admin when a product is purchased",
      htmlContent: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">

  <!-- HEADER -->
  <div style="padding:24px;text-align:center;background:#eff6ff;">
    <h2 style="margin:0;color:#1d4ed8;">New Store Order</h2>
  </div>

  <!-- BODY -->
  <div style="padding:24px;">
    
    <p><strong>{{username}}</strong> purchased:</p>
    <h3 style="margin:8px 0 16px;">{{productName}}</h3>

    <p>Seller: <strong>{{creatorName}}</strong></p>

    <!-- PAYMENT -->
<!-- PAYMENT -->
{{#if isGP}}
  <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:16px;">
    <p style="margin:0;">
      💰 GP Amount: <strong>{{totalPaid}} GP</strong>
    </p>
  </div>
{{else}}
  <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-top:16px;">
    <h3 style="margin:0 0 12px;font-size:15px;">💳 Payment Breakdown</h3>

    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td>Base Price</td>
        <td style="text-align:right;">{{currencySymbol}}{{baseAmount}}</td>
      </tr>

      <tr>
        <td>Discount</td>
        <td style="text-align:right;color:#dc2626;">
          − {{currencySymbol}}{{discount}}
        </td>
      </tr>

      <tr>
        <td>Net Amount</td>
        <td style="text-align:right;">
          {{currencySymbol}}{{netBase}}
        </td>
      </tr>

      <tr>
        <td>GST</td>
        <td style="text-align:right;">
          {{currencySymbol}}{{gst}}
        </td>
      </tr>

      <tr style="border-top:2px solid #16a34a;">
        <td><strong>Total Paid</strong></td>
        <td style="text-align:right;color:#16a34a;">
          <strong>{{currencySymbol}}{{totalPaid}}</strong>
        </td>
      </tr>
    </table>
  </div>

  <!-- 🔥 NEW: REVENUE SPLIT -->
{{#if showRevenueSplit}}
  <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin-top:20px;">
    <h3 style="margin:0 0 12px;font-size:15px;">🏢 Revenue Split</h3>

    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="color:#6b7280;">
          Platform Fee ({{commissionPercent}}% of {{currencySymbol}}{{netBase}})
        </td>
        <td style="text-align:right;color:#2563eb;">
          {{currencySymbol}}{{platformFee}}
        </td>
      </tr>

      <tr>
        <td style="color:#6b7280;">Creator Earning</td>
        <td style="text-align:right;color:#16a34a;">
          {{currencySymbol}}{{creatorEarning}}
        </td>
      </tr>

      <tr style="border-top:2px solid #e5e7eb;">
        <td><strong>Platform Revenue</strong></td>
        <td style="text-align:right;color:#2563eb;">
          <strong>{{currencySymbol}}{{platformEarning}}</strong>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#9ca3af;margin-top:10px;">
      Commission is calculated on net amount (after discount).
      GST is excluded from platform revenue.
    </p>
  </div>
  {{/if}}
{{/if}}

    <!-- META -->
    <div style="margin-top:16px;font-size:13px;color:#6b7280;">
      <p style="margin:4px 0;">Transaction ID: <strong>{{transactionId}}</strong></p>
      <p style="margin:4px 0;">Payment Method: {{paymentMethod}}</p>
      <p style="margin:4px 0;">Payment Date: {{paymentDate}}</p>
    </div>

  </div>
</div>
`,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const tmpl of templates) {
    const exists = await prisma.emailTemplate.findUnique({
      where: { templateId: tmpl.templateId },
    });

    if (!exists) {
      await prisma.emailTemplate.create({
        data: {
          ...tmpl,
          htmlContent: tmpl.htmlContent.trim(),
        },
      });

      createdCount++;
    } else {
      skippedCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`Seeded ${createdCount} email template(s) successfully!`);
  }

  if (skippedCount > 0) {
    console.log(
      `Skipped ${skippedCount} email template(s) (already exist, admin edits preserved)`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
