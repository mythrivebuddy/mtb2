import { ProsperityDropStatus, SpotlightStatus } from "@prisma/client";
import { Step } from "@/components/ApplicationStepper";

export const spotlightSteps: Step[] = [
  {
    id: "applied",
    title: "Applied",
    description: "You've taken the first step!",
    status: "completed",
  },
  {
    id: "in-review",
    title: "In Review",
    description: "Under assessment stay tuned!",
    status: "current",
  },
  {
    id: "approved",
    title: "Approved",
    description: "You're in! Get ready to shine",
    status: "upcoming",
  },
  {
    id: "active",
    title: "Active",
    description: "Your Spotlight is live now",
    status: "upcoming",
  },
];

export const prosperitySteps: Step[] = [
  {
    id: "applied",
    title: "Applied",
    description: "Application submitted",
    status: "completed",
  },
  {
    id: "in-review",
    title: "In Review",
    description: "Under evaluation",
    status: "current",
  },
  {
    id: "approved",
    title: "Approved",
    description: "Application successful",
    status: "upcoming",
  },
];

export const SpotlightStepperMap: Record<SpotlightStatus, number> = {
  [SpotlightStatus.APPLIED]: 0,
  [SpotlightStatus.IN_REVIEW]: 1,
  [SpotlightStatus.APPROVED]: 2,
  [SpotlightStatus.ACTIVE]: 3,
  [SpotlightStatus.DISAPPROVED]: -1,
  [SpotlightStatus.EXPIRED]: -1,
};

export const ProsperityStepperMap: Record<ProsperityDropStatus, number> = {
  [ProsperityDropStatus.APPLIED]: 0,
  [ProsperityDropStatus.IN_REVIEW]: 1,
  [ProsperityDropStatus.APPROVED]: 2,
  [ProsperityDropStatus.DISAPPROVED]: -1,
};
