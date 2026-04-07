import axios from "axios";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate } from "@/utils/renderEmailContent";

interface EmailData {
  toEmail: string;
  toName: string;
  templateId: string;
  templateData: Record<string, any>;
}

export async function sendEmailUsingTemplate({
  toEmail,
  toName,
  templateId,
  templateData,
}: EmailData) {
  const senderEmail = process.env.CONTACT_SENDER_EMAIL;
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !brevoApiKey) {
    throw new Error("Missing necessary environment variables");
  }

  const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";
  const headers = {
    "Content-Type": "application/json",
    "api-key": brevoApiKey,
  };

  const template = await prisma.emailTemplate.findUnique({
    where: { templateId },
  });

  if (!template) {
    throw new Error(`Email template with id "${templateId}" not found`);
  }

  const emailContent = renderEmailTemplate(template.htmlContent, templateData);

  const payload = {
    sender: { email: senderEmail, name: "MyThriveBuddy" },
    to: [{ email: toEmail, name: toName }],
    subject: renderEmailTemplate(template.subject, templateData),
    htmlContent: emailContent,
  };

  await axios.post(brevoApiUrl, payload, { headers });
}

interface DirectEmailData {
  userId: string;
  subject: string;
  body: string; // This is assumed to be pre-rendered HTML content
}
export async function sendEmail({ userId, subject, body }: DirectEmailData) {
  const senderEmail = process.env.CONTACT_SENDER_EMAIL;
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !brevoApiKey) {
    throw new Error(
      "Missing necessary environment variables for sending email",
    );
  }

  // 1. Get user's email and name from the database using Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }, // Only select the fields you need
  });

  if (!user || !user.email) {
    throw new Error(`User with id "${userId}" not found or has no email.`);
  }

  // 2. Set up Brevo API details
  const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";
  const headers = {
    "Content-Type": "application/json",
    "api-key": brevoApiKey,
  };

  // 3. Construct the payload with the direct subject and body
  const payload = {
    sender: { email: senderEmail, name: "MyThriveBuddy" },
    // Use the fetched user's email and name
    to: [{ email: user.email, name: user.name || undefined }],
    subject: subject, // Use the subject from the function argument
    htmlContent: body, // Use the body from the function argument
  };

  // 4. Send the email via Brevo
  await axios.post(brevoApiUrl, payload, { headers });
}

export async function sendInvoiceEmail({
  to,
  pdfBuffer,
  order,
  invoiceNumber,
}: {
  to: string;
  pdfBuffer: Buffer;
  order: any;
  invoiceNumber: string;
}) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        email: process.env.CONTACT_SENDER_EMAIL,
        name: "MyThriveBuddy",
      },
      to: [{ email: to }],
      subject: "Your Invoice",
      htmlContent: `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; padding:24px;">
      
      <h2 style="color:#1E2875; margin-bottom:10px;">
        Payment Confirmed ✅
      </h2>

      <p style="font-size:14px; color:#333;">
        Hi there,
      </p>

      <p style="font-size:14px; color:#333;">
        Thank you for your purchase! Your payment has been successfully processed.
      </p>

      <div style="background:#f1f5f9; padding:12px 16px; border-radius:8px; margin:16px 0;">
        <p style="margin:0; font-size:13px;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p style="margin:4px 0 0; font-size:13px;"><strong>Order ID:</strong> ${order.id}</p>
        <p style="margin:4px 0 0; font-size:13px;"><strong>Amount Paid:</strong> ₹${order.totalAmount / 100}</p>
      </div>

      <p style="font-size:14px; color:#333;">
        📎 Your invoice is attached to this email for your records.
      </p>

      <p style="font-size:14px; color:#333;">
        If you have any questions, feel free to reply to this email.
      </p>

      <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />

      <p style="font-size:12px; color:#888;">
        — Team MyThriveBuddy
      </p>

    </div>
  </div>
`,

      attachment: [
        {
          name: `${invoiceNumber}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
    },
  );
}
