import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
