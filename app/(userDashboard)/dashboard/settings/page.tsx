import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import SettingsPageClient from "@/components/dashboard/settings/SettingsPageClient";
import { getServerSession } from "next-auth";

export default async function SettingsPage() {
  const session = await getServerSession(authConfig);
  
  const isAffiliateOrCoach =  session?.user.isAffiliate || session?.user.userType === "COACH";
  return <SettingsPageClient isAffiliateOrCoach={isAffiliateOrCoach}/>;
}
