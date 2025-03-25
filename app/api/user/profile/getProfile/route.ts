import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  console.log("GetProfile: userId", userId);

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const profile = await prisma.userBusinessProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Define the fields to check
    const fieldsToCheck = [
      "name",
      "businessInfo",
      "missionStatement",
      "goals",
      "keyOfferings",
      "achievements",
      "email",
      "phone",
      "website",
      "featuredWorkTitle",
      "featuredWorkDesc",
      "featuredWorkImage",
      "priorityContactLink",
    ];

    let totalFields = fieldsToCheck.length + 1; // +1 for socialHandles
    let filledFields = 0;

    // Check each field (ignoring default/empty values)
    fieldsToCheck.forEach((field) => {
      if (
        profile[field as keyof typeof profile] &&
        profile[field as keyof typeof profile] !== ""
      ) {
        filledFields++;
      }
    });

    // Check socialHandles: if at least one handle is provided
    let socialFilled = false;
    if (profile.socialHandles) {
      socialFilled = Object.values(profile.socialHandles).some(
        (value) => value && value !== ""
      );
    }
    if (socialFilled) filledFields++;

    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    // Return the profile with the computed completion percentage
    const profileWithCompletion = { ...profile, completionPercentage };

    return NextResponse.json(
      {
        message: "Profile fetched successfully",
        profile: profileWithCompletion,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get profile API Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
