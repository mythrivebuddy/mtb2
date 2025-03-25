import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId || Array.isArray(userId)) {
    return NextResponse.json(
      { error: "Invalid or missing userId" },
      { status: 400 }
    );
  }

  try {
    // Parse the form data
    const formData = await req.formData();
    const entries = Object.fromEntries(formData.entries());

    // Process file upload
    let fileUrl: string | undefined;
    const file = formData.get("featuredWorkImage");
    console.log("File received:", file);

    if (file instanceof File && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `spotlight-image/${fileName}`;

      const { data, error } = await supabase.storage
        .from("spotlight-image")
        .upload(filePath, file);

      if (error) throw new Error(`Supabase Upload Error: ${error.message}`);
      console.log("Upload data:", data);

      const { data: publicUrl } = supabase.storage
        .from("spotlight-image")
        .getPublicUrl(filePath);
      fileUrl = publicUrl.publicUrl;
    }

    // Helper to parse JSON safely
    function tryParseJson(jsonString: unknown) {
      if (typeof jsonString !== "string") return {};
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("JSON parse error:", e);
        return {};
      }
    }

    // Build update data using all fields
    const updateData = {
      name: entries.name?.toString(),
      businessInfo: entries.businessInfo?.toString(),
      missionStatement: entries.missionStatement?.toString(),
      goals: entries.goals?.toString(),
      keyOfferings: entries.keyOfferings?.toString(),
      achievements: entries.achievements?.toString(),
      email: entries.email?.toString(),
      phone: entries.phone?.toString(),
      website: entries.website?.toString(),
      socialHandles: tryParseJson(entries.socialHandles) || {},
      isSpotlightActive: entries.isSpotlightActive === "true",
      spotlightExpiry: entries.spotlightExpiry?.toString(),
      featuredWorkTitle: entries.featuredWorkTitle?.toString(),
      featuredWorkDesc: entries.featuredWorkDesc?.toString(),
      // Use new file URL if available; otherwise, keep existing value.
      featuredWorkImage: fileUrl || entries.featuredWorkImage?.toString(),
      priorityContactLink: entries.priorityContactLink?.toString(),
    };

    if (!updateData.name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing profile to compare completion and reward status before updating
    const oldProfile = await prisma.userBusinessProfile.findUnique({
      where: { userId },
    });

    // Helper: Calculate profile completion percentage using all fields
    const calculateCompletion = (profileData: any): number => {
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
      const totalFields = fieldsToCheck.length + 1; // +1 for socialHandles
      let filledFields = 0;

      fieldsToCheck.forEach((field) => {
        if (profileData[field] && profileData[field] !== "") {
          filledFields++;
        }
      });

      let socialFilled = false;
      if (profileData.socialHandles) {
        socialFilled = Object.values(profileData.socialHandles).some(
          (value) => value && value !== ""
        );
      }
      if (socialFilled) filledFields++;

      return Math.round((filledFields / totalFields) * 100);
    };

    // Upsert the profile.
    // When creating a new profile, set profileJpRewarded to false.
    const profile = await prisma.userBusinessProfile.upsert({
      where: { userId },
      create: { userId, ...updateData, profileJpRewarded: false },
      update: updateData,
    });

    const newCompletion = calculateCompletion(profile);
    console.log("New Profile Completion:", newCompletion);

    let oldCompletion = 0;
    if (oldProfile) {
      oldCompletion = calculateCompletion(oldProfile);
      console.log("Old Profile Completion:", oldCompletion);
    }

    // Only award JP if:
    // - New completion is at least 70%
    // - Old completion was below 70%
    // - And the profile hasn't been rewarded yet (profileJpRewarded is false)
    if (
      newCompletion >= 70 &&
      oldCompletion < 70 &&
      !(oldProfile && oldProfile.profileJpRewarded)
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { jpEarned: { increment: 70 } }, // Adjust JP increment as needed
      });

      // Mark the profile as rewarded
      await prisma.userBusinessProfile.update({
        where: { userId },
        data: { profileJpRewarded: true },
      });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", profile },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Update error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
