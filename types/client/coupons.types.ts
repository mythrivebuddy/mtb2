/* ------------------------------------------------------------------ */
/* SHARED TYPES - ADMIN + COACH                                       */
/* ------------------------------------------------------------------ */

export type CouponScope =
  | "SUBSCRIPTION"
  | "CHALLENGE"
  | "MMP_PROGRAM"
  | "STORE_PRODUCT";

export type CouponType =
  | "PERCENTAGE"
  | "FIXED"
  | "FULL_DISCOUNT"
  | "FREE_DURATION";

export type Challenge = {
  id: string;
  title: string;
  challengeJoiningFee: number;
  challengeJoiningFeeCurrency: "INR" | "USD";
};

export type MmpProgram = {
  id: string;
  name: string;
  price: number;
  currency: "INR" | "USD";
};

export type StoreProduct = {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
};

export type Plan = {
  id: string;
  name: string;
  interval: string;
  userType: string;
};

export type Coupon = {
  id: string;
  couponCode: string;
  description?: string;
  type: CouponType;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  scope: CouponScope;

  discountPercentage?: number;
  discountAmountUSD?: number;
  discountAmountINR?: number;
  freeDays?: number;

  startDate: string;
  endDate: string;

  maxGlobalUses?: number;
  maxUsesPerUser?: number;

  firstCycleOnly?: boolean;
  multiCycle?: boolean;

  applicableUserTypes: string[];
  applicableCurrencies: string[];

  autoApply: boolean;

  // Admin only
  applicablePlans?: Plan[];

  // Coach/Admin
  applicableChallenges?: Challenge[];
  applicableMmpPrograms?: MmpProgram[];
  applicableStoreProducts?: StoreProduct[];

  _count?: { redemptions: number };
};

export type CouponFormPayload = {
  couponCode: string;
  description: string;
  type: CouponType;

  discountPercentage: string | number;
  discountAmountUSD: string | number | null;
  discountAmountINR: string | number | null;
  freeDays: string | number;

  applicableUserTypes: string[];

  scope: CouponScope;

  // Admin
  applicablePlanIds?: string[];

  // Coach/Admin
  applicableChallengeIds: string[];
  applicableMmpProgramIds: string[];
  applicableStoreProductIds: string[];

  applicableCurrencies: string[];

  firstCycleOnly: boolean;
  multiCycle: boolean;

  startDate: string;
  endDate: string;

  maxGlobalUses: string | number;
  maxUsesPerUser: number;

  autoApply: boolean;
};
export type CoachDataResponse = {
    challenges: Challenge[];
    products: StoreProduct[];
    coupons: Coupon[];
};

export type UpdateCouponPayload = {
    description?: string;
    type?: CouponType;

    discountPercentage?: number | null;
    discountAmountUSD?: number | null;
    discountAmountINR?: number | null;
    freeDays?: number | null;

    maxGlobalUses?: number | null;
    maxUsesPerUser?: number;

    startDate?: string;
    endDate?: string;

    applicableChallengeIds?: string[];
    applicableMmpProgramIds?: string[];
    applicableStoreProductIds?: string[];

    applicableUserTypes?: string[];
    applicableCurrencies?: string[];

    autoApply?: boolean;
};