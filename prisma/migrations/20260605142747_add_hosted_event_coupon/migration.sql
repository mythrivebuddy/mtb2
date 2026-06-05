-- CreateTable
CREATE TABLE "public"."_CouponHostedEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CouponHostedEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CouponHostedEvents_B_index" ON "public"."_CouponHostedEvents"("B");

-- AddForeignKey
ALTER TABLE "public"."_CouponHostedEvents" ADD CONSTRAINT "_CouponHostedEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CouponHostedEvents" ADD CONSTRAINT "_CouponHostedEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."HostedEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
