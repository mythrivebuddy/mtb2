import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";

type Data = { message: string; profile?: any } | { error: string };

export default async function PUT(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { userId } = req.query;

  // Validate userId type from query (should be string)
  if (Array.isArray(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  // Authenticate the request using NextAuth session
  const session = await getSession({ req });
  if (!session || session.user.id !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const updateData = req.body;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Try to find the existing profile
    let profile = await prisma.userBusinessProfile.findUnique({
      where: { userId },
    });
    let firstTimeUpdating = false;

    if (!profile) {
      // Create profile if it doesn't exist yet
      profile = await prisma.userBusinessProfile.create({
        data: { userId, ...updateData },
      });
      firstTimeUpdating = true;
    } else {
      // Save a copy of the old profile for comparison
      const oldProfile = { ...profile };

      // Update the profile with new data
      profile = await prisma.userBusinessProfile.update({
        where: { userId },
        data: updateData,
      });

      // Check if any previously blank field is now filled
      for (const key in updateData) {
        // @ts-ignore: dynamic key access
        if ((oldProfile as any)[key] == null && updateData[key] != null) {
          firstTimeUpdating = true;
          break;
        }
      }
    }

    // Reward JoyPearls for first time profile completion or updating previously blank fields
    if (firstTimeUpdating) {
      await prisma.user.update({
        where: { id: userId },
        data: { jpEarned: { increment: 50 } },
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
