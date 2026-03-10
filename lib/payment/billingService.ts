import { prisma } from "@/lib/prisma";
interface BillingInput {
    name?: string;
    email?: string;
    phone?: string;
    addressLine1: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    gstNumber?: string;
}

export async function upsertBilling(
    userId: string,
    billing: BillingInput
) {
    return prisma.billingInformation.upsert({
        where: { userId },

        update: {
            fullName: billing.name ?? "",
            email: billing.email ?? "",
            phone: billing.phone ?? null,
            addressLine1: billing.addressLine1,
            city: billing.city,
            state: billing.state ?? "",
            postalCode: billing.postalCode,
            country: billing.country,
            gstNumber: billing.gstNumber ?? null,
        },

        create: {
            userId,
            fullName: billing.name ?? "",
            email: billing.email ?? "",
            phone: billing.phone ?? null,
            addressLine1: billing.addressLine1,
            city: billing.city,
            state: billing.state ?? "",
            postalCode: billing.postalCode,
            country: billing.country,
            gstNumber: billing.gstNumber ?? null,
        },
    });
}