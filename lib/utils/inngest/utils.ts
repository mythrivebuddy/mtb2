import { inngest } from "@/lib/inngest";


export async function safeInngestSend(
  payload: Parameters<typeof inngest.send>[0]
) {
  try {
    await inngest.send(payload);
  } catch (error) {
    console.error("❌ Inngest send failed:", error);
  }
}