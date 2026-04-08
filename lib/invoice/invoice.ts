import { prisma } from "@/lib/prisma";
import { STATE_NAME_MAP } from "../constant";

export async function getBillingInfo(
  userId: string,
  options?: { preferLegacy?: boolean }
) {
  const preferLegacy = options?.preferLegacy ?? false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  // ---- Helper formatters ----
  const formatNew = (billing: any) => ({
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
  });

  const formatLegacy = (legacy: any) => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: legacy.phone,
    addressLine1: legacy.addressLine1,
    addressLine2: legacy.addressLine2,
    city: legacy.city,
    state: legacy.state,
    postalCode: legacy.postalCode,
    country: legacy.country,
    gstNumber: legacy.gstNumber,
  });

  // ---- 1️⃣ If store condition → check legacy FIRST ----
  if (preferLegacy) {
    const legacy = await prisma.userBillingInformation.findUnique({
      where: { userId },
    });

    if (legacy) return formatLegacy(legacy);
  }

  // ---- 2️⃣ Always check new table ----
  const billing = await prisma.billingInformation.findUnique({
    where: { userId },
  });

  if (billing) return formatNew(billing);

  // ---- 3️⃣ If not already checked → fallback to legacy ----
  if (!preferLegacy) {
    const legacy = await prisma.userBillingInformation.findUnique({
      where: { userId },
    });

    if (legacy) return formatLegacy(legacy);
  }

  // ---- 4️⃣ Final fallback ----
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
    const key = state.toLowerCase().trim();
  return STATE_NAME_MAP[key] || key;
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

  // ✅ STRICT comparison only
  const isSameState = billingState === businessState;

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