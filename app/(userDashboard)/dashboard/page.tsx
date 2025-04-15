"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Prisma } from "@prisma/client";
import JPCard from "@/components/dashboard/JPCard";
import PageLoader from "@/components/PageLoader";
import RightPanel from "@/components/dashboard/user/RightPanel";
import { ApplicationStepper } from "@/components/ApplicationStepper";
import {
  spotlightSteps,
  SpotlightStepperMap,
  prosperitySteps,
  ProsperityStepperMap,
} from "@/lib/constants/applicationSteps";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  // const queryClient = useQueryClient();

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
  });

  const { data: prosperityApplications, isLoading: prosperityLoading } =
    useQuery<Prisma.ProsperityDropGetPayload<{ include: { user: true } }>[]>({
      queryKey: ["prosperityDrops", session?.user?.id],
      queryFn: async () => {
        const response = await axios.get("/api/user/prosperity");
        return response.data;
      },
      retry: false,
      enabled: !!session?.user?.id,
    });

  console.log(spotlights);

  // const createSpotlight = async () => {
  //   const response = await axios.post("/api/user/spotlight", {
  //     userId: session?.user?.id,
  //   });
  //   return response.data;
  // };

  // const mutation = useMutation({
  //   mutationFn: createSpotlight,
  //   onSuccess: (data) => {
  //     console.log(data);
  //     toast.success("Spotlight application submitted successfully");
  //     queryClient.invalidateQueries({ queryKey: ["spotlight"] }); // Refetch spotlight data
  //     queryClient.invalidateQueries({ queryKey: ["userInfo"] }); // Refetch user data
  //   },
  //   onError: (error) => {
  //     toast.error(getAxiosErrorMessage(error));
  //   },
  // });

  if (
    spotlightLoading ||
    status === "loading" ||
    userLoading ||
    prosperityLoading
  ) {
    return <PageLoader />;
  }

  const currentSpotlight:
    | Prisma.SpotlightGetPayload<{
        include: { user: true };
      }>
    | undefined = spotlights?.find((spotlight) => {
    return ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
      spotlight.status
    );
  });
  console.log("currentSpotlight", currentSpotlight);

  const currentProsperity = prosperityApplications?.find((prosperity) => {
    return ["APPLIED", "IN_REVIEW", "APPROVED"].includes(prosperity.status);
  });
  console.log("currentProsperity", currentProsperity);

  return (
    <div className="container mx-auto p-0">
      <div className="flex gap-8">
        {/* Main Dashboard Content */}
        <div className="flex-[3]">
          <div className="grid grid-cols-3 gap-4 my-3">
            <JPCard value={userData?.jpEarned || 0} label="Total JP Earned" />
            <JPCard value={userData?.jpSpent || 0} label="Total JP Spent" />
            <JPCard value={userData?.jpBalance || 0} label="JP Balance" />
          </div>
          {/* <ConfirmAction
            action={() => mutation.mutate()}
            isDisabled={
              mutation.isPending ||
              (spotlights &&
                spotlights.some((spotlight) =>
                  ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
                    spotlight.status
                  )
                ))
            }
          >
            <Button
              disabled={
                mutation.isPending ||
                (spotlights &&
                  spotlights.some((spotlight) =>
                    ["APPLIED", "IN_REVIEW", "APPROVED", "ACTIVE"].includes(
                      spotlight.status
                    )
                  ))
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Apply for Spotlight
            </Button>
          </ConfirmAction> */}
          <h2 className="text-2xl mt-4 mb-4 text-slate-800">Spotlight</h2>
          <ApplicationStepper
            steps={spotlightSteps}
            currentStep={
              currentSpotlight
                ? SpotlightStepperMap[currentSpotlight?.status]
                : 0
            }
          />

          <h2 className="text-2xl mt-8 mb-4 text-slate-800">Prosperity Drop</h2>
          <ApplicationStepper
            steps={prosperitySteps}
            currentStep={
              currentProsperity
                ? ProsperityStepperMap[currentProsperity?.status]
                : 0
            }
          />
        </div>

        {/* Divider Between Main and Right Panel */}
        <div className="h-screen w-0.5 bg-gray-300 dark:bg-brown-500 self-stretch"></div>

        {/* Right Panel */}
        <div className="flex-[1.1]">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
