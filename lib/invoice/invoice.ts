import { prisma } from "@/lib/prisma";

export async function getBillingInfo(userId: string) {
  const billing = await prisma.billingInformation.findUnique({
    where: { userId },
  });

  if (billing) {
    return {
      name: billing.fullName,
      email: billing.email,
      phone: billing.phone,
      addressLine1: billing.addressLine1,
      addressLine2: billing.addressLine2,
      city: billing.city,
      state: billing.state,
      postalCode: billing.postalCode,
      country: billing.country,
      gstNumber: billing.gstNumber,
    };
  }

  // 2️⃣ Fallback old table
  const legacy = await prisma.userBillingInformation.findUnique({
    where: { userId },
  });

  if (legacy) {
    return {
      name: "", // fallback
      email: "",
      phone: legacy.phone,
      addressLine1: legacy.addressLine1,
      addressLine2: legacy.addressLine2,
      city: legacy.city,
      state: legacy.state,
      postalCode: legacy.postalCode,
      country: legacy.country,
      gstNumber: legacy.gstNumber,
    };
  }

  // 3️⃣ Hard fallback (minimal)
  return {
    name: "Customer",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    gstNumber: null,
  };
}

function normalizeState(state: string = "") {
  return state.toLowerCase().trim();
}

export function getGSTDetails(
  billing: { country: string; state: string },
  business: { state: string }
) {
  const isIndia =
    billing.country?.toLowerCase() === "in" ||
    billing.country?.toLowerCase() === "india";

  if (!isIndia) {
    return { type: "EXPORT", cgst: 0, sgst: 0, igst: 0 };
  }

  const billingState = normalizeState(billing.state);
  const businessState = normalizeState(business.state);

  const isSameState =
    billingState === businessState ||
    billingState.includes("madhya pradesh") ||
    billingState.includes("mp");

  if (isSameState) {
    return { type: "INTRA", cgst: 9, sgst: 9, igst: 0 };
  }

  return { type: "INTER", cgst: 0, sgst: 0, igst: 18 };
}

export async function generateInvoiceNumber() {
  const year = new Date().getFullYear().toString();

  return prisma.$transaction(async (tx) => {
    const business = await tx.mtbBusinessProfile.findFirst();
    if (!business) throw new Error("Business profile missing");

    const series = (business.invoiceSeries as Record<string, number>) || {};

    const last = series[year] || 0;
    const next = last + 1;

    series[year] = next;

    await tx.mtbBusinessProfile.update({
      where: { id: business.id },
      data: { invoiceSeries: series },
    });

    const padded = String(next).padStart(6, "0");

    return `MTB-${year}-${padded}`;
  });
}