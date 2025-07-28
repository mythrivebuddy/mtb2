// This file defines the shape of data passed from the server to the client.
// By using strings for dates, we ensure the data is serializable.

export interface ChallengeDetailsForClient {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  mode: "PUBLIC" | "PERSONAL";
  reward: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  // Dates are strings to ensure they can be passed from server to client.
  startDate: string;
  endDate: string;
  creator: { name: string };
  templateTasks: Array<{ id: string; description: string }>;
  _count?: { enrollments: number };
}
