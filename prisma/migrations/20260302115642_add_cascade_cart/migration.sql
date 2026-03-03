-- DropForeignKey
ALTER TABLE "public"."Cart" DROP CONSTRAINT "Cart_itemId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
