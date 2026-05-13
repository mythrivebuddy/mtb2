"use client";

import AppearanceSettings from "./AppearanceSettings";
import FinancialSettings from "./FinancialSettings";

export default function SettingsPageClient({
  isAffiliateOrCoach,
}: {
  isAffiliateOrCoach: boolean;
}) {
  return (
    <div className="mx-auto w-full space-y-4 px-4 pb-8">
      <AppearanceSettings />
      {isAffiliateOrCoach && <FinancialSettings />}
    </div>
  );
}
