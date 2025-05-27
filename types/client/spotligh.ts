import { SpotlightStatus } from "@prisma/client";

export interface SpotlightApplication {
  id: string;
  user: {
    name: string;
    email: string;
    id: string;
    image: string | null;
  };
  status: SpotlightStatus;
  appliedAt: string;
}