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
    sender: { email: senderEmail },
    to: [{ email: toEmail, name: toName }],
    subject: template.subject,
    htmlContent: emailContent,
  };

  await axios.post(brevoApiUrl, payload, { headers });
}

interface DirectEmailData {
  userId: string;
  subject: string;
  body: string; // This is assumed to be pre-rendered HTML content
}
export async function sendEmail({
  userId,
  subject,
  body,
}: DirectEmailData) {
  const senderEmail = process.env.CONTACT_SENDER_EMAIL;
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !brevoApiKey) {
    throw new Error("Missing necessary environment variables for sending email");
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
    sender: { email: senderEmail },
    // Use the fetched user's email and name
    to: [{ email: user.email, name: user.name || undefined }],
    subject: subject, // Use the subject from the function argument
    htmlContent: body, // Use the body from the function argument
  };

  // 4. Send the email via Brevo
  await axios.post(brevoApiUrl, payload, { headers });
}