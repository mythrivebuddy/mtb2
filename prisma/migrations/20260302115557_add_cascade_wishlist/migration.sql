-- DropForeignKey
ALTER TABLE "public"."Wishlist" DROP CONSTRAINT "Wishlist_itemId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Wishlist" ADD CONSTRAINT "Wishlist_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
