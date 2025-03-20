import { prisma } from "@/lib/prisma";
import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";

type Data = { message: string; profile?: any } | { error: string };

export default async function GET(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { userId } = req.query;

  if (Array.isArray(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const session = await getSession({ req });
  if (!session || session.user.id !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch the business profile for the given userId
    const profile = await prisma.userBusinessProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    console.log(profile);
    return res
      .status(200)
      .json({ message: "Profile fetched successfully", profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
