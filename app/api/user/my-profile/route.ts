import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { profileSchema } from "@/schema/zodSchema";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
//import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    console.log("Session in POST:", session);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const profileData = {
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
    };
    console.log("Received profile data:", profileData);

    const validationResult = profileSchema.safeParse(profileData);
    if (!validationResult.success) {
      console.log("Validation errors:", validationResult.error.format());
      return NextResponse.json(
        {
          message: "Invalid profile data",
          errors: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

       const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }


   let imageUrl = "";
    const profilePicture = formData.get("profilePicture") as File;

    if (profilePicture && profilePicture.size > 0) {
      try {
        const fileExt = profilePicture.name.split(".").pop() || "jpg";
        const folderPath = `${user.id}`;
        const filePath = `${folderPath}/personal.${fileExt}`;

        // Find existing "personal.*" files only (any extension) and remove them
        const { data: existingFiles, error: listError } =
          await supabaseAdmin.storage.from("profile-images").list(folderPath);

        if (listError) {
          console.error("Error listing existing photos:", listError.message);
        }

        const personalFiles = (existingFiles ?? []).filter((f) =>
          f.name.startsWith("personal."),
        );

        if (personalFiles.length > 0) {
          const pathsToRemove = personalFiles.map(
            (f) => `${folderPath}/${f.name}`,
          );
          const { error: deleteError } = await supabaseAdmin.storage
            .from("profile-images")
            .remove(pathsToRemove);

          if (deleteError) {
            console.error(
              "Error deleting previous photo:",
              deleteError.message,
            );
          }
        }

        console.log("Uploading profile picture...");
        const { error: uploadError } = await supabaseAdmin.storage
          .from("profile-images")
          .upload(filePath, profilePicture, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = await supabaseAdmin.storage
          .from("profile-images")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
        console.log("Uploaded image URL:", imageUrl);
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        return NextResponse.json(
          { message: "Failed to upload profile picture" },
          { status: 500 },
        );
      }
    }
 

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: profileData.name,
        image: imageUrl || user.image,
        bio: profileData.bio,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        socialHandles: true,
        userBusinessProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile fetched successfully",
      profile: user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
