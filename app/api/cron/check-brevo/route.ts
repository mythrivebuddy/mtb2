import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

interface BrevoContact {
  email: string;
  attributes?: {
    USERTYPE?: string;
  };
}

interface BrevoResponse {
  contacts: BrevoContact[];
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const offset = Number(searchParams.get("offset") ?? "0");
    const limit = 500;

    const res = await axios.get<BrevoResponse>(
      `https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}`,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
        },
      }
    );

    const contacts = res.data.contacts;

    let updated = 0;

    for (const contact of contacts) {
      const hasUserType = Boolean(contact.attributes?.USERTYPE);

      await prisma.user.updateMany({
        where: { email: contact.email },
        data: {
          isInBrevo: true,
          brevoUserTypeSynced: hasUserType,
        },
      });

      updated++;
    }

    return NextResponse.json({
      message: "Brevo check cron completed",
      batchSize: contacts.length,
      usersUpdated: updated,
      nextOffset: offset + limit,
    });
  } catch (error) {
    console.error("Brevo check cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}