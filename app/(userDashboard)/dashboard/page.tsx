"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Prisma } from "@prisma/client";
import RightPanel from "@/components/dashboard/user/RightPanel";
import { ApplicationStepper } from "@/components/ApplicationStepper";
import {
  spotlightSteps,
  SpotlightStepperMap,
  prosperitySteps,
  ProsperityStepperMap,
} from "@/lib/constants/applicationSteps";
import PageSkeleton from "@/components/PageSkeleton";

import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import AnnouncementBar from "@/components/announcement/AnnouncementBar";
import DashboardCards from "@/components/dashboard/DashboardCards";
import MyLifeBlueprint from "@/components/dashboard/user/MyLifeBlueprint";
import { getGreetingData } from "@/lib/utils/utils";
import { getTodayRange } from "@/lib/utils/dateUtils";
import { DashboardContent } from "@/types/client/dashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  useOnlineUserLeaderBoard();

  const { data: spotlights, isLoading: spotlightLoading } = useQuery<
    Prisma.SpotlightGetPayload<{ include: { user: true } }>[]
  >({
    queryKey: ["spotlight", session?.user?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/user/spotlight`);
      return response.data;
    },
    retry: false,
    enabled: !!session?.user?.id,
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const response = await axios.get("/api/user");
      return response.data.user;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: prosperityApplications, isLoading: prosperityLoading } =
    useQuery<Prisma.ProsperityDropGetPayload<{ include: { user: true } }>[]>({
      queryKey: ["prosperityDrops", session?.user?.id],
      queryFn: async () => {
        const response = await axios.get(`/api/user/prosperity`);
        return response.data;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  const { data: dashboardContent, isLoading: dashboardContentLoading } =
    useQuery<DashboardContent>({
      queryKey: ["dashboard-content"],
      queryFn: async () => {
        const { start, end } = getTodayRange();
        const res = await axios.get(`/api/user/dashboard-content`, {
          params: { start, end },
        });
        return res.data;
      },
    });

  if (
    spotlightLoading ||
    status === "loading" ||
    userLoading ||
    prosperityLoading ||
    dashboardContentLoading
  ) {
    // return <PageLoader />;
    return <PageSkeleton type="dashboard" />;
  }

  const currentSpotlight:
    | Prisma.SpotlightGetPayload<{
        include: { user: true };
      }>
    | undefined = spotlights?.find((spotlight) => {
    return ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
      spotlight.status,
    );
  });

  const currentProsperity = prosperityApplications?.find((prosperity) => {
    return ["APPLIED", "IN_REVIEW", "APPROVED"].includes(prosperity.status);
  });
  const { text, Icon, color } = getGreetingData();

  return (
    <>
      <AnnouncementBar />
      <div className="sm:py-6 px-4">
        <div className="flex flex-col gap-3 mb-4 mt-4 sm:mt-0">
          <h1 className="text-xl sm:text-3xl font-semibold flex gap-2 items-center">
            {text}, {userData?.name}
            <Icon className={color} />
          </h1>
          <p className="text-muted-foreground">
            MTB is your personal & professional growth environment
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Dashboard Content */}

          <div className="flex-1">
            <MyLifeBlueprint
              data={dashboardContent?.userMakeoverCommitment || []}
              cmpProgramId={dashboardContent?.cmpProgramId || ""}
            />
            <div className="">
              <DashboardCards
                jpBalance={userData?.jpBalance}
                alignedAction={dashboardContent?.alignedAction || []}
                dailyBlooms={dashboardContent?.dailyBlooms || []}
                onePercentProgressVault={
                  dashboardContent?.onePercentProgressVault || []
                }
                miracleLogs={dashboardContent?.miracleLogs || []}
                challenges={dashboardContent?.challenges || []}
                mmpPrograms={dashboardContent?.mmpPrograms || []}
                accountabilityHubGroups={dashboardContent?.accountabilityHubGroups || []}
                // event={dashboardContent?.events}
              />
            </div>
            {/* ✅ MOBILE STEPPERS */}
            {session?.user.userType === "COACH" && (
              <div className="mt-6 lg:hidden">
                <h2 className="text-lg mb-3 text-slate-800 font-semibold">
                  Spotlight
                </h2>
                <div className="w-full overflow-x-auto">
                  <ApplicationStepper
                    steps={spotlightSteps}
                    currentStep={
                      currentSpotlight
                        ? SpotlightStepperMap[currentSpotlight?.status]
                        : 0
                    }
                  />
                </div>

                <h2 className="text-lg mt-6 mb-3 text-slate-800 font-semibold">
                  Prosperity Drop
                </h2>
                <div className="w-full overflow-x-auto">
                  <ApplicationStepper
                    steps={prosperitySteps}
                    currentStep={
                      currentProsperity
                        ? ProsperityStepperMap[currentProsperity?.status]
                        : 0
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          {/* <div className="hidden lg:block h-auto w-px bg-gray-300 dark:bg-brown-500"></div> */}

          {/* Right Panel */}
          <div className="lg:flex-[0.4] mt-6 lg:mt-0">
            <RightPanel
              jpEarned={userData?.jpEarned || 0}
              jpSpent={userData?.jpSpent || 0}
              jpBalance={userData?.jpBalance || 0}
            />
          </div>
        </div>
        <div className="hidden lg:block">
          {session?.user.userType === "COACH" && (
            <>
              <h2 className="text-xl sm:text-2xl mt-6 mb-4 text-slate-800 font-semibold">
                Spotlight
              </h2>
              <ApplicationStepper
                steps={spotlightSteps}
                currentStep={
                  currentSpotlight
                    ? SpotlightStepperMap[currentSpotlight?.status]
                    : 0
                }
              />

              <h2 className="text-xl sm:text-2xl mt-8 mb-4 text-slate-800 font-semibold">
                Prosperity Drop
              </h2>
              <ApplicationStepper
                steps={prosperitySteps}
                currentStep={
                  currentProsperity
                    ? ProsperityStepperMap[currentProsperity?.status]
                    : 0
                }
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
