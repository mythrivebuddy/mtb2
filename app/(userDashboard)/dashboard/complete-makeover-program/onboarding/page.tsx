import MakeoverOnboardingComponent from "@/components/complete-makevoer-program/MakeoverOnboardingComponent";


export const metadata = () => {
  return {
    title: "Makeover Onboarding | Complete Your Setup",
    description:
      "Complete your makeover onboarding to personalize your experience and get started quickly.",
  };
};

export default  function MakeoverOnboardingPage() {
  return (
    <>
      <MakeoverOnboardingComponent/>
    </>
  )
}
