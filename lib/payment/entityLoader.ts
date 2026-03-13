import { prisma } from "@/lib/prisma";

export async function getPurchasableEntity(
    context: "CHALLENGE" | "MMP_PROGRAM" | "STORE_PRODUCT",
    entityId: string
) {

    switch (context) {

        case "CHALLENGE": {
            const challenge = await prisma.challenge.findUnique({
                where: { id: entityId },
            });

            if (!challenge) throw new Error("Challenge not found");

            return {
                id: challenge.id,
                price: challenge.challengeJoiningFee,
                currency: challenge.challengeJoiningFeeCurrency,
            };
        }

        case "MMP_PROGRAM": {
            const program = await prisma.program.findUnique({
                where: { id: entityId },
            });

            if (!program) throw new Error("Program not found");

            return {
                id: program.id,
                price: program.price,
                currency: program.currency,
            };
        }

        case "STORE_PRODUCT": {
            //   const product = await prisma.storeProduct.findUnique({
            //     where: { id: entityId },
            //   });

            //   if (!product) throw new Error("Product not found");

            //   return {
            //     id: product.id,
            //     price: product.price,
            //     currency: product.currency,
            //   };
        }

        default:
            throw new Error("Invalid purchase context");
    }
}