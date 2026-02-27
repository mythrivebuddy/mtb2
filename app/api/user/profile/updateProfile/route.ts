// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import calculateProfileCompletion from "@/utils/calculateProfileCompletion";
// import { assignJp } from "@/lib/utils/jp";
// import { ActivityType } from "@prisma/client";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// interface UserSpotlightProfile {
//   featuredWorkTitle?: string | null;
//   featuredWorkDesc?: string | null;
//   featuredWorkImage?: string | null;
//   priorityContactLink?: string | null;
// }

// // type UpdateProfileRequest = {
// //   userId: string;
// //   name?: string;
// //   businessInfo?: string;
// //   missionStatement?: string;
// //   goals?: string;
// //   keyOfferings?: string;
// //   achievements?: string;
// //   email?: string | null;
// //   phone?: string;
// //   website?: string;
// //   socialHandles?: Record<string, unknown> | string;
// //   isSpotlightActive?: boolean;
// //   featuredWorkTitle?: string | null;
// //   featuredWorkDesc?: string | null;
// //   featuredWorkImage?: string | null;
// //   priorityContactLink?: string | null;
// // };

// // const body: UpdateProfileRequest = await req.json();
// // const { userId, ...entries } = body;

// function checkSpotlightFieldsComplete(profile: UserSpotlightProfile): boolean {
//   const spotlightFields: (keyof UserSpotlightProfile)[] = [
//     "featuredWorkTitle",
//     "featuredWorkDesc",
//     "featuredWorkImage",
//     "priorityContactLink",
//   ];

//   return spotlightFields.every((field) => {
//     const value = profile[field];
//     return typeof value === "string" && value.trim() !== "";
//   });
// }

// function tryParseJson(jsonString: unknown) {
//   if (typeof jsonString !== "string") return {};
//   try {
//     return JSON.parse(jsonString);
//   } catch (e) {
//     console.error("JSON parse error:", e);
//     return {};
//   }
// }

// // export async function PUT(req: Request) {
// //   console.log("************************Received profile update request************************")
// //   const { searchParams } = new URL(req.url);
// //   const userId = searchParams.get("userId");

// //   if (!userId || Array.isArray(userId)) {
// //     return NextResponse.json(
// //       { error: "Invalid or missing userId" },
// //       { status: 400 }
// //     );
// //   }

// //   try {
// //     const formData = await req.formData();
// //     const entries = Object.fromEntries(formData.entries());

// //     // Get existing profile first
// //     const existingProfile = await prisma.userBusinessProfile.findUnique({
// //       where: { userId },
// //     });

// //     // File upload handling
// //     let fileUrl: string | undefined;
// //     const file = formData.get("featuredWorkImage");

// //     if (file instanceof File && file.size > 0) {
// //       const fileExt = file.name.split(".").pop();
// //       const fileName = `${Date.now()}.${fileExt}`;
// //       const filePath = `spotlight-image/${fileName}`;

// //       const { error } = await supabaseAdmin.storage
// //         .from("spotlight-image")
// //         .upload(filePath, file);

// //       if (error) throw new Error(`Supabase Upload Error: ${error.message}`);

// //       const { data: publicUrl } = supabaseAdmin.storage
// //         .from("spotlight-image")
// //         .getPublicUrl(filePath);

// //       fileUrl = publicUrl.publicUrl;
// //     }

// //     // Prepare update data
// //     const updateData = {
// //       name: entries.name?.toString(),
// //       businessInfo: entries.businessInfo?.toString(),
// //       missionStatement: entries.missionStatement?.toString(),
// //       goals: entries.goals?.toString(),
// //       keyOfferings: entries.keyOfferings?.toString(),
// //       achievements: entries.achievements?.toString(),
// //       email: entries.email === "" ? null : entries.email?.toString(),
// //       phone: entries.phone?.toString(),
// //       website: entries.website?.toString(),
// //       socialHandles: tryParseJson(entries.socialHandles) || {},
// //       isSpotlightActive: entries.isSpotlightActive === "true",
// //       featuredWorkTitle: entries.featuredWorkTitle?.toString(),
// //       featuredWorkDesc: entries.featuredWorkDesc?.toString(),
// //       // Preserve existing image if no new file is uploaded
// //       featuredWorkImage:
// //         fileUrl ||
// //         existingProfile?.featuredWorkImage ||
// //         entries.featuredWorkImage?.toString(),
// //       priorityContactLink: entries.priorityContactLink?.toString(),
// //     };

// //     // Verify user exists
// //     const user = await prisma.user.findUnique({
// //       where: { id: userId },
// //       include: { plan: true },
// //     });
// //     if (!user) {
// //       return NextResponse.json({ error: "User not found" }, { status: 404 });
// //     }

// //     // Check if spotlight fields are complete
// //     const isSpotlightComplete = checkSpotlightFieldsComplete({
// //       ...existingProfile,
// //       ...updateData,
// //     });

// //     // Upsert the profile
// //     const profile = await prisma.userBusinessProfile.upsert({
// //       where: { userId },
// //       create: {
// //         userId,
// //         ...updateData,
// //         profileJpRewarded: false,
// //         isProfileComplete: isSpotlightComplete,
// //       },
// //       update: {
// //         ...updateData,
// //         isProfileComplete: isSpotlightComplete,
// //       },
// //     });

// //     const newCompletion = calculateProfileCompletion(profile);
// //     const oldCompletion = existingProfile
// //       ? calculateProfileCompletion(existingProfile)
// //       : 0;

// //     // JP Reward Logic
// //     if (
// //       newCompletion >= 100 &&
// //       oldCompletion < 100 &&
// //       !(existingProfile && existingProfile.profileJpRewarded)
// //     ) {
// //       assignJp(user, ActivityType.BUSINESSPROFILE_COMPLETE);

// //       await prisma.userBusinessProfile.update({
// //         where: { userId },
// //         data: { profileJpRewarded: true },
// //       });
// //     }

// //     return NextResponse.json(
// //       { message: "Profile updated successfully", profile },
// //       { status: 200 }
// //     );
// //   } catch (error) {
// //     console.error(
// //       "Update error:",
// //       error instanceof Error ? error.message : error
// //     );
// //     return NextResponse.json(
// //       { error: "Failed to update profile" },
// //       { status: 500 }
// //     );
// //   }
// // }

// export async function PUT(req: Request) {
//   console.log("************************Received profile update request************************")

//   const contentType = req.headers.get("content-type") || ""
//   const { searchParams } = new URL(req.url)
//   const queryUserId = searchParams.get("userId")

//   let userId: string | null = queryUserId
//   let bodyData: any = {}
//   let formData: FormData | null = null

//   try {
//     /* ------------------------------------------------ */
//     /* HANDLE JSON (NEW MULTI-STEP FORM) */
//     /* ------------------------------------------------ */

//     if (contentType.includes("application/json")) {
//       bodyData = await req.json()
//       userId = bodyData.userId
//     }

//     /* ------------------------------------------------ */
//     /* HANDLE OLD FORMDATA (SPOTLIGHT EDIT) */
//     /* ------------------------------------------------ */

//     if (contentType.includes("multipart/form-data")) {
//       formData = await req.formData()
//       bodyData = Object.fromEntries(formData.entries())
//       userId = queryUserId
//     }

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Invalid or missing userId" },
//         { status: 400 }
//       )
//     }

//     /* ------------------------------------------------ */
//     /* FETCH EXISTING PROFILE */
//     /* ------------------------------------------------ */

//     const existingProfile = await prisma.userBusinessProfile.findUnique({
//       where: { userId },
//     })

//     /* ------------------------------------------------ */
//     /* FILE UPLOAD (ONLY FOR FORMDATA FLOW) */
//     /* ------------------------------------------------ */

//     let fileUrl: string | undefined

//     if (formData) {
//       const file = formData.get("featuredWorkImage")

//       if (file instanceof File && file.size > 0) {
//         const fileExt = file.name.split(".").pop()
//         const fileName = `${Date.now()}.${fileExt}`
//         const filePath = `spotlight-image/${fileName}`

//         const { error } = await supabaseAdmin.storage
//           .from("spotlight-image")
//           .upload(filePath, file)

//         if (error) throw new Error(`Supabase Upload Error: ${error.message}`)

//         const { data: publicUrl } = supabaseAdmin.storage
//           .from("spotlight-image")
//           .getPublicUrl(filePath)

//         fileUrl = publicUrl.publicUrl
//       }
//     }

//     /* ------------------------------------------------ */
//     /* PREPARE UPDATE DATA (OLD + NEW FIELDS) */
//     /* ------------------------------------------------ */

//     const updateData = {
//       /* ---------- EXISTING FIELDS ---------- */
//       name: bodyData.name ?? undefined,
//       businessInfo: bodyData.businessInfo ?? undefined,
//       missionStatement: bodyData.missionStatement ?? undefined,
//       goals: bodyData.goals ?? undefined,
//       keyOfferings: bodyData.keyOfferings ?? undefined,
//       achievements: bodyData.achievements ?? undefined,
//       email: bodyData.email === "" ? null : bodyData.email ?? undefined,
//       phone: bodyData.phone ?? undefined,
//       website: bodyData.website ?? undefined,
//       socialHandles:
//         typeof bodyData.socialHandles === "string"
//           ? tryParseJson(bodyData.socialHandles)
//           : bodyData.socialHandles ?? {},

//       isSpotlightActive: bodyData.isSpotlightActive === true || bodyData.isSpotlightActive === "true",
//       featuredWorkTitle: bodyData.featuredWorkTitle ?? undefined,
//       featuredWorkDesc: bodyData.featuredWorkDesc ?? undefined,
//       featuredWorkImage:
//         fileUrl ||
//         existingProfile?.featuredWorkImage ||
//         bodyData.featuredWorkImage,
//       priorityContactLink: bodyData.priorityContactLink ?? undefined,

//       /* ---------- NEW MULTI-STEP FIELDS ---------- */
//       tagline: bodyData.tagline ?? undefined,
//       coachingDomains: bodyData.coachingDomains ?? undefined,
//       targetAudience: bodyData.targetAudience ?? undefined,
//       transformation: bodyData.transformation ?? undefined,
//       typicalResults: bodyData.typicalResults ?? undefined,
//       sessionStyles: bodyData.sessionStyles ?? undefined,
//       methodology: bodyData.methodology ?? undefined,
//       toolsFrameworks: bodyData.toolsFrameworks ?? undefined,
//       servicesOffered: bodyData.servicesOffered ?? undefined,
//       languages: bodyData.languages ?? undefined,
//       timezone: bodyData.timezone ?? undefined,
//       sessionFormat: bodyData.sessionFormat ?? undefined,
//       sessionDuration: bodyData.sessionDuration ?? undefined,
//       priceMin: bodyData.priceMin ?? undefined,
//       priceMax: bodyData.priceMax ?? undefined,
//       yearsOfExperience: bodyData.yearsOfExperience ?? undefined,
//       certifications: bodyData.certifications ?? undefined,
//       shortBio: bodyData.shortBio ?? undefined,
//       testimonials: bodyData.testimonials ?? undefined,
//       introVideo: bodyData.introVideo ?? undefined,
//       linkedin: bodyData.linkedin ?? undefined,
//       profilePhoto: bodyData.profilePhoto ?? undefined,
//     }

//     /* ------------------------------------------------ */
//     /* VERIFY USER */
//     /* ------------------------------------------------ */

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { plan: true },
//     })

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 })
//     }

//     /* ------------------------------------------------ */
//     /* SPOTLIGHT COMPLETION CHECK (UNCHANGED) */
//     /* ------------------------------------------------ */

//     const isSpotlightComplete = checkSpotlightFieldsComplete({
//       ...existingProfile,
//       ...updateData,
//     })

//     /* ------------------------------------------------ */
//     /* UPSERT PROFILE */
//     /* ------------------------------------------------ */

//     const profile = await prisma.userBusinessProfile.upsert({
//       where: { userId },
//       create: {
//         userId,
//         ...updateData,
//         profileJpRewarded: false,
//         isProfileComplete: isSpotlightComplete,
//       },
//       update: {
//         ...updateData,
//         isProfileComplete: isSpotlightComplete,
//       },
//     })

//     /* ------------------------------------------------ */
//     /* COMPLETION + JP LOGIC (UNCHANGED) */
//     /* ------------------------------------------------ */

//     const newCompletion = calculateProfileCompletion(profile)
//     const oldCompletion = existingProfile
//       ? calculateProfileCompletion(existingProfile)
//       : 0

//     if (
//       newCompletion >= 100 &&
//       oldCompletion < 100 &&
//       !(existingProfile && existingProfile.profileJpRewarded)
//     ) {
//       assignJp(user, ActivityType.BUSINESSPROFILE_COMPLETE)

//       await prisma.userBusinessProfile.update({
//         where: { userId },
//         data: { profileJpRewarded: true },
//       })
//     }

//     return NextResponse.json(
//       { message: "Profile updated successfully", profile },
//       { status: 200 }
//     )
//   } catch (error) {
//     console.error(
//       "Update error:",
//       error instanceof Error ? error.message : error
//     )

//     return NextResponse.json(
//       { error: "Failed to update profile" },
//       { status: 500 }
//     )
//   }
// }

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import calculateProfileCompletion from "@/utils/calculateProfileCompletion"
import { assignJp } from "@/lib/utils/jp"
import { ActivityType } from "@prisma/client"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

/* ------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------ */

interface Testimonial {
  name: string
  role: string
  content: string
}

interface UpdateProfileRequest {
  userId?: string

  name?: string
  businessInfo?: string
  missionStatement?: string
  goals?: string
  keyOfferings?: string
  achievements?: string
  email?: string | null
  phone?: string
  website?: string
  socialHandles?: Record<string, unknown> | string

  isSpotlightActive?: boolean | string
  featuredWorkTitle?: string | null
  featuredWorkDesc?: string | null
  featuredWorkImage?: string | null
  priorityContactLink?: string | null

  tagline?: string
  coachingDomains?: string[]
  targetAudience?: string[]
  transformation?: string
  typicalResults?: string[]
  sessionStyles?: string[]
  methodology?: string
  toolsFrameworks?: string[]
  servicesOffered?: string[]
  languages?: string[]
  timezone?: string
  sessionFormat?: string
  sessionDuration?: string
  priceMin?: number
  priceMax?: number
  yearsOfExperience?: number
  certifications?: string[]
  shortBio?: string
  testimonials?: Testimonial[]
  introVideo?: string
  linkedin?: string
  profilePhoto?: string | null
}


interface ProfileRequestBody {
  featuredWorkImage?: string
  priorityContactLink?: string
  shortBio?: string
  yearsOfExperience?: number
}
/* ------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------ */

function parseArray(value: unknown): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return undefined
}

function parseTestimonials(value: unknown): Testimonial[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value as Testimonial[]
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return undefined
}

// function tryParseJson(jsonString: unknown) {
//   if (typeof jsonString !== "string") return {}
//   try {
//     return JSON.parse(jsonString)
//   } catch {
//     return {}
//   }
// }

/* ------------------------------------------------ */
/* PUT */
/* ------------------------------------------------ */

export async function PUT(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    const { searchParams } = new URL(req.url)
    let userId = searchParams.get("userId")

    let bodyData: UpdateProfileRequest = {}
    let formData: FormData | null = null
    /* ---------------- JSON ---------------- */

    if (contentType.includes("application/json")) {
      bodyData = await req.json()
      userId = bodyData.userId ?? userId
    }

    /* ---------------- FORMDATA ---------------- */

    if (contentType.includes("multipart/form-data")) {
      formData = await req.formData()
      bodyData = Object.fromEntries(formData.entries()) as ProfileRequestBody
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid or missing userId" },
        { status: 400 }
      )
    }

    /* ---------------- EXISTING PROFILE ---------------- */

    const existingProfile = await prisma.userBusinessProfile.findUnique({
      where: { userId },
    })

    /* ---------------- PROFILE PHOTO HANDLING ---------------- */

    let profilePhotoUrl: string | undefined

    if (formData) {
      const photoFile = formData.get("profilePhoto")
      if (photoFile instanceof File && photoFile.size > 0) {
        // Delete previous profile photo if it exists
        if (existingProfile?.profilePhoto) {
          const photoPath = existingProfile.profilePhoto.split("/").pop()
          if (photoPath) {
            const { error: deleteError } = await supabaseAdmin.storage
              .from("profile-images")
              .remove([photoPath])

            if (deleteError) {
              console.error("Error deleting previous photo:", deleteError.message)
            }
          }
        }

        const ext = photoFile.name.split(".").pop()
        const fileName = `profile-${Date.now()}.${ext}`
        const filePath = `${fileName}`

        const { error } = await supabaseAdmin.storage
          .from("profile-images")
          .upload(filePath, photoFile, { upsert: true })

        if (error) throw new Error(error.message)

        const { data } = await supabaseAdmin.storage
          .from("profile-images")
          .getPublicUrl(filePath)
        profilePhotoUrl = data.publicUrl;
      }// 2️⃣ Existing photo kept (string URL)
      else if (typeof photoFile === "string") {
        profilePhotoUrl = photoFile
      }

    }

    /* ---------------- UPDATE DATA ---------------- */

    // const updateData = {
    //   name: bodyData.name ?? undefined,
    //   businessInfo: bodyData.businessInfo ?? undefined,
    //   missionStatement: bodyData.missionStatement ?? undefined,
    //   goals: bodyData.goals ?? undefined,
    //   keyOfferings: bodyData.keyOfferings ?? undefined,
    //   achievements: bodyData.achievements ?? undefined,
    //   email: bodyData.email === "" ? null : bodyData.email ?? undefined,
    //   phone: bodyData.phone ?? undefined,
    //   website: bodyData.website ?? undefined,
    //   socialHandles:
    //     typeof bodyData.socialHandles === "string"
    //       ? tryParseJson(bodyData.socialHandles)
    //       : bodyData.socialHandles ?? undefined,

    //   isSpotlightActive:
    //     bodyData.isSpotlightActive === true ||
    //     bodyData.isSpotlightActive === "true",

    //   featuredWorkTitle: bodyData.featuredWorkTitle ?? undefined,
    //   featuredWorkDesc: bodyData.featuredWorkDesc ?? undefined,
    //   featuredWorkImage: bodyData.featuredWorkImage ?? undefined,
    //   priorityContactLink: bodyData.priorityContactLink ?? undefined,

    //   tagline: bodyData.tagline ?? undefined,
    //   coachingDomains: parseArray(bodyData.coachingDomains),
    //   targetAudience: parseArray(bodyData.targetAudience),
    //   transformation: bodyData.transformation ?? undefined,
    //   typicalResults: parseArray(bodyData.typicalResults),
    //   sessionStyles: parseArray(bodyData.sessionStyles),
    //   methodology: bodyData.methodology ?? undefined,
    //   toolsFrameworks: parseArray(bodyData.toolsFrameworks) as Prisma.JsonArray | undefined,
    //   servicesOffered: parseArray(bodyData.servicesOffered),
    //   languages: parseArray(bodyData.languages),
    //   timezone: bodyData.timezone ?? undefined,
    //   sessionFormat: bodyData.sessionFormat ?? undefined,
    //   sessionDuration: bodyData.sessionDuration ?? undefined,
    //   priceMin:
    //     typeof bodyData.priceMin === "number"
    //       ? bodyData.priceMin
    //       : Number(bodyData.priceMin) || undefined,
    //   priceMax:
    //     typeof bodyData.priceMax === "number"
    //       ? bodyData.priceMax
    //       : Number(bodyData.priceMax) || undefined,
    //   yearsOfExperience:
    //     typeof bodyData.yearsOfExperience === "number"
    //       ? bodyData.yearsOfExperience
    //       : Number(bodyData.yearsOfExperience) || undefined,
    //   certifications: parseArray(bodyData.certifications),
    //   shortBio: bodyData.shortBio ?? undefined,
    //   testimonials: parseTestimonials(bodyData.testimonials) as Prisma.JsonArray | undefined,
    //   introVideo: bodyData.introVideo ?? undefined,
    //   linkedin: bodyData.linkedin ?? undefined,
    //   profilePhoto: profilePhotoUrl ?? existingProfile?.profilePhoto,
    // }

    const updateData = {
  name: bodyData.name ?? undefined,
  businessInfo: bodyData.businessInfo ?? undefined,
  missionStatement: bodyData.missionStatement ?? undefined,
  goals: bodyData.goals ?? undefined,
  keyOfferings: bodyData.keyOfferings ?? undefined,
  achievements: bodyData.achievements ?? undefined,
  email: bodyData.email === "" ? null : bodyData.email ?? undefined,
  phone: bodyData.phone ?? undefined,
  website: bodyData.website ?? undefined,

  socialHandles:
    typeof bodyData.socialHandles === "string"
      ? bodyData.socialHandles
      : bodyData.socialHandles
      ? JSON.stringify(bodyData.socialHandles)
      : undefined,

  isSpotlightActive:
    bodyData.isSpotlightActive === true ||
    bodyData.isSpotlightActive === "true",

  featuredWorkTitle: bodyData.featuredWorkTitle ?? undefined,
  featuredWorkDesc: bodyData.featuredWorkDesc ?? undefined,
  featuredWorkImage: bodyData.featuredWorkImage ?? undefined,
  priorityContactLink: bodyData.priorityContactLink ?? undefined,

  tagline: bodyData.tagline ?? undefined,
  coachingDomains: parseArray(bodyData.coachingDomains),
  targetAudience: parseArray(bodyData.targetAudience),
  transformation: bodyData.transformation ?? undefined,
  typicalResults: parseArray(bodyData.typicalResults),
  sessionStyles: parseArray(bodyData.sessionStyles),
  methodology: bodyData.methodology ?? undefined,

  // 🔥 FIXED
  toolsFrameworks: parseArray(bodyData.toolsFrameworks)
    ? JSON.stringify(parseArray(bodyData.toolsFrameworks))
    : undefined,

  servicesOffered: parseArray(bodyData.servicesOffered),
  languages: parseArray(bodyData.languages),
  timezone: bodyData.timezone ?? undefined,
  sessionFormat: bodyData.sessionFormat ?? undefined,
  sessionDuration: bodyData.sessionDuration ?? undefined,

  priceMin:
    typeof bodyData.priceMin === "number"
      ? bodyData.priceMin
      : Number(bodyData.priceMin) || undefined,

  priceMax:
    typeof bodyData.priceMax === "number"
      ? bodyData.priceMax
      : Number(bodyData.priceMax) || undefined,

  yearsOfExperience:
    typeof bodyData.yearsOfExperience === "number"
      ? bodyData.yearsOfExperience
      : Number(bodyData.yearsOfExperience) || undefined,

  certifications: parseArray(bodyData.certifications),

  shortBio: bodyData.shortBio ?? undefined,

  // 🔥 FIXED
  testimonials: parseTestimonials(bodyData.testimonials)
    ? JSON.stringify(parseTestimonials(bodyData.testimonials))
    : undefined,

  introVideo: bodyData.introVideo ?? undefined,
  linkedin: bodyData.linkedin ?? undefined,
  profilePhoto: profilePhotoUrl ?? existingProfile?.profilePhoto,
}
    /* ---------------- USER CHECK ---------------- */

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    /* ---------------- UPSERT ---------------- */

    const profile = await prisma.userBusinessProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
        profilePhoto: updateData.profilePhoto ?? "",
        profileJpRewarded: false,
        isProfileComplete: false,
      },
      update: updateData,
    })

    /* ---------------- COMPLETION ---------------- */

    const newCompletion = calculateProfileCompletion(profile)
    const oldCompletion = existingProfile
      ? calculateProfileCompletion(existingProfile)
      : 0

    if (
      newCompletion >= 100 &&
      oldCompletion < 100 &&
      !(existingProfile && existingProfile.profileJpRewarded)
    ) {
      assignJp(user, ActivityType.BUSINESSPROFILE_COMPLETE)

      await prisma.userBusinessProfile.update({
        where: { userId },
        data: { profileJpRewarded: true },
      })
    }

    return NextResponse.json(
      { message: "Profile updated successfully", profile },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}