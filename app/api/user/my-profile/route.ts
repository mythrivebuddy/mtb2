import {  NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { profileSchema } from "@/schema/zodSchema";
import handleSupabaseImageUpload from "@/lib/utils/supabase-image-upload";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get form data from request
    const formData = await req.formData();
    
    // Extract profile data
    const profileData = {
      fullName: formData.get("fullName") as string,
      bio: formData.get("bio") as string,
      skills: formData.get("skills") as string,
      instagram: formData.get("instagram") as string,
      linkedin: formData.get("linkedin") as string,
      website: formData.get("website") as string,
    };
    
    // Validate profile data with Zod schema
    const validationResult = profileSchema.safeParse(profileData);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid profile data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Handle profile picture upload if present
    let imageUrl = "";
    const profilePicture = formData.get("profilePicture") as File;
    
    if (profilePicture && profilePicture.size > 0) {
      try {
        imageUrl = await handleSupabaseImageUpload(
          profilePicture,
          "profile-images",
          session.user.email
        );
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        return NextResponse.json(
          { message: "Failed to upload profile picture" },
          { status: 500 }
        );
      }
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userProfile: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    let profile;
    
    if (user.userProfile) {
      // Update existing profile
      profile = await prisma.userProfile.update({
        where: { id: user.userProfile.id },
        data: {
          ...validationResult.data,
          profilePicture: imageUrl || user.userProfile.profilePicture,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new profile
      profile = await prisma.userProfile.create({
        data: {
          ...validationResult.data,
          profilePicture: imageUrl || null,
          userId: user.id
        }
      });
    }
    
    return NextResponse.json({
      message: user.userProfile ? "Profile updated successfully" : "Profile created successfully",
      profile: {
        ...profile
      },
    });
    
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find the user and their profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userProfile: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // If no profile exists, return 404
    if (!user.userProfile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }
    
    // Return the profile data
    return NextResponse.json({
      message: "Profile fetched successfully",
      profile: {
        fullName: user.userProfile.fullName,
        bio: user.userProfile.bio || "",
        skills: user.userProfile.skills || "",
        instagram: user.userProfile.instagram || "",
        linkedin: user.userProfile.linkedin || "",
        website: user.userProfile.website || "",
        profilePicture: user.userProfile.profilePicture || null
      }
    });
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
} 