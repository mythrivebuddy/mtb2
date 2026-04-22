import axios from "axios";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate, renderEmailTemplateUsingConditionals } from "@/utils/renderEmailContent";
import { formatDate } from "@/lib/utils/dateUtils";

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
  purchaseData,
  business,
}: {
  to: string;
  pdfBuffer: Buffer;
  order: any;
  invoiceNumber: string;
  purchaseData: any;
  business: any;
}) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  // 1️⃣ Select template
  let templateId = "invoice-challenge";

  if (purchaseData?.type === "mmp") {
    templateId = "invoice-mmp";
  } else if (purchaseData?.type === "store") {
    templateId = "order-placed";
  }

  // 2️⃣ Get template
  const template = await prisma.emailTemplate.findUnique({
    where: { templateId },
  });

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // 3️⃣ Prepare data
  const items =
    purchaseData?.type === "store"
      ? purchaseData.items // ✅ ALWAYS FULL ITEMS
      : purchaseData?.items || [];
  const templateData =
    purchaseData?.type === "store"
      ? {
          username: order.user?.name ?? "Customer",

          orderId: order.id,
          orderDate: new Date(order.paidAt || Date.now()).toLocaleDateString(
            "en-IN",
          ),

          totalAmount: `${order.totalAmount} ${order.currency}`, // ✅ FULL ORDER

          status: "COMPLETED",

          itemCount: items.length,

          itemNames: items
            .map(
              (i: any) =>
                `${i.name} (×${i.quantity}) - ${i.price} ${order.currency}`,
            )
            .join(", "),

          orderUrl: `${process.env.NEXT_URL}/dashboard/store/order-history`, // ✅ ADD THIS

          currency: order.currency,

          paymentDetails: `Paid with Razorpay (${order.currency})`,
        }
      : {
          // ✅ EXISTING INVOICE FLOW (unchanged)
          username: order.user?.name || "User",
          email: order.user?.email,

          invoiceNumber,
          orderId: order.id,

          totalAmount: order.totalAmount,
          baseAmount: order.baseAmount,
          discount: order.discountApplied,
          gst: order.gstAmount,

          companyName: business.companyName,

          challengeName:
            purchaseData?.type === "challenge" ? purchaseData.name : undefined,

          programName:
            purchaseData?.type === "mmp" ? purchaseData.name : undefined,

          items:
            purchaseData?.type === "store" ? purchaseData.items : undefined,
        };

  // 4️⃣ Render
  const htmlContent = renderEmailTemplate(template.htmlContent, templateData);

  const subject = renderEmailTemplate(template.subject, templateData);

  // 5️⃣ Send email
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        email: process.env.CONTACT_SENDER_EMAIL,
        name: "MyThriveBuddy",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
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

export async function sendEmailUsingTemplateWithConditionals({
  toEmail,
  toName,
  templateId,
  templateData,
}: EmailData) {
  const senderEmail = process.env.CONTACT_SENDER_EMAIL;
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !brevoApiKey) {
    throw new Error("Missing email environment variables");
  }

  // 🔹 Fetch template
  const template = await prisma.emailTemplate.findUnique({
    where: { templateId },
  });

  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }

  // 🔹 Render using YOUR conditional engine
  const htmlContent = renderEmailTemplateUsingConditionals(
    template.htmlContent,
    templateData
  );

  const subject = renderEmailTemplateUsingConditionals(
    template.subject,
    templateData
  );

  // 🔹 Brevo payload
  const payload = {
    sender: {
      email: senderEmail,
      name: "MyThriveBuddy",
    },
    to: [
      {
        email: toEmail,
        name: toName,
      },
    ],
    subject,
    htmlContent,
  };

  // 🔹 Send
  await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
  });
}