import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { actionId } = await req.json();

  const snoozedUntill = new Date(Date.now() + 5 * 60 * 1000);

  // ✅ overwrite previous snooze (dedupe)
  await prisma.alignedAction.update({
    where: { id: actionId },
    data: {
      snoozedUntill,
      popupShown: false,
      activeReminder: null,
    },
  });

  // ✅ still send event
  await inngest.send({
    name: "aligned-action/snooze",
    data: { actionId, snoozedUntill },
  });

  return NextResponse.json({ ok: true });
}
