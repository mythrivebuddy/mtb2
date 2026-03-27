// lib/brevo.ts
import { PlanUserType } from "@prisma/client";
import axios from "axios";

interface BrevoContact {
  email: string;
  firstName?: string;
  lastName?: string;
  userType?: PlanUserType | null;
}

export async function addOrUpdateBrevoContact({
  email,
  firstName,
  lastName,
  userType,
}: BrevoContact): Promise<void> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = Number(process.env.BREVO_LIST_ID);

  if (!BREVO_API_KEY || !BREVO_LIST_ID) {
    console.error("Brevo API Key or List ID is not configured.");
    return;
  }

  const url = "https://api.brevo.com/v3/contacts";

  const payload = {
    email,
    attributes: {
      // These attribute names MUST match what you have in Brevo (e.g., FIRSTNAME, LASTNAME)
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      USERTYPE: userType,
    },
    listIds: [BREVO_LIST_ID],
    updateEnabled: true, // This is key: it updates the contact if the email already exists.
  };

  const headers = {
    "api-key": BREVO_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    // 1. Store the response in a variable
    const response = await axios.post(url, payload, { headers });

    // 2. Log the actual data from Brevo's response
    console.log(`✅ Request to Brevo for ${email} was sent successfully.`);
    console.log("📬 Brevo's Actual API Response:", response.data);
  } catch (error) {
    console.error("❌ Failed to add user to Brevo list.");
    if (axios.isAxiosError(error)) {
      console.error("Brevo API Error:", error.response?.data);
    }
  }
}
