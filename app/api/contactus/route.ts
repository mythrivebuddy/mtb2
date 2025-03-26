import { NextResponse } from "next/server";
import axios from "axios";

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type RequestBody = {
  formData: FormData;
  captchaToken: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body: RequestBody = await request.json();
    const { formData, captchaToken } = body;
    const { name, email, subject, message } = formData;

    // Captcha verification
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) throw new Error("Missing RECAPTCHA_SECRET_KEY");
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verificationResponse = await axios.post(verifyUrl, null, {
      params: { secret, response: captchaToken },
    });
    if (!verificationResponse.data.success) {
      return NextResponse.json(
        { message: "Captcha verification failed" },
        { status: 400 }
      );
    }

    // Prepare email payloads
    const senderEmail = process.env.CONTACT_SENDER_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!senderEmail || !adminEmail || !brevoApiKey) {
      throw new Error("Missing necessary environment variables");
    }
    const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";

    const thankYouEmailPayload = {
      sender: { email: senderEmail },
      to: [{ email, name }],
      subject: "Thank you for your response",
      htmlContent: `<p>Hi ${name},</p>
                    <p>Thank you for contacting us. We have received your message and will get back to you soon.</p>`,
    };

    const adminEmailPayload = {
      sender: { email: senderEmail },
      to: [{ email: adminEmail }],
      subject: "New Contact Us Message",
      htmlContent: `<p>You have received a new message from <strong>${name}</strong> (${email}).</p>
                    <p>Subject: ${subject}</p>
                    <p>Message:</p>
                    <p>${message}</p>`,
    };

    const headers = {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    };

    // Send emails
    await axios.post(brevoApiUrl, thankYouEmailPayload, { headers });
    await axios.post(brevoApiUrl, adminEmailPayload, { headers });

    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
