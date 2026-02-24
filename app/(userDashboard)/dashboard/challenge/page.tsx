import { getServerSession } from "next-auth";
import ChallengePage from "./_components/ChallengeClientPage";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { featureConfig } from "@/lib/access-control/featureConfig";

export const metadata = {
  title: "Challenges - MyThriveBuddy",
  description:
    "Join or create challenges to boost your motivation and achieve your goals with the MTB community.",
};

export default async function Challenge() {
  const session = await getServerSession(authConfig);

  let canIssueCertificate = false;

  if (session?.user.membership && session.user.userType) {
    const planKey = session.user.membership === "PAID" ? "paid" : "free";
    const plansForMembership = featureConfig.challenges.plans?.[planKey];

    if (plansForMembership && session.user.userType in plansForMembership) {
      const plan =
        plansForMembership[
          session.user.userType as keyof typeof plansForMembership
        ];

      canIssueCertificate = Boolean(
        (plan as { canIssueCertificate?: boolean })?.canIssueCertificate,
      );
    }
  }

  return <ChallengePage canIssueCertificate={canIssueCertificate} />;
}
