import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function getCMPNotification(
  type: NotificationType
): Promise<{ title: string; description: string; url?: string } | null> {
  const setting = await prisma.notificationSettings.findUnique({
    where: { notification_type: type },
  });

  if (!setting) return null;

  return {
    title: setting.title,
    description: setting.message,
    url: setting.url ?? undefined,
  };
}
