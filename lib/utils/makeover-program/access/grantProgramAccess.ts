import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { AccessError } from "./AccessError";

export interface ProgramAccess {
  userId: string;
  programId: string;
}

export async function grantProgramAccess(): Promise<ProgramAccess> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AccessError("Unauthorized", 401);
  }

  const userId = session.user.id;

  const purchase = await prisma.oneTimeProgramPurchase.findFirst({
    where: {
      userId,
      status: PaymentStatus.PAID,
    },
    select: {
      productId: true,
    },
  });

  if (!purchase) {
    throw new AccessError("Program not purchased", 403);
  }

  return {
    userId,
    programId: purchase.productId,
  };
}
