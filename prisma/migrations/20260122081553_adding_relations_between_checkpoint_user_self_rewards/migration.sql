-- AddForeignKey
ALTER TABLE "public"."UserMakeoverSelfReward" ADD CONSTRAINT "UserMakeoverSelfReward_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "public"."MakeoverSelfRewardCheckpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
