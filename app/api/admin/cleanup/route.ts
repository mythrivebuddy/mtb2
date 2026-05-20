// Fire when needed
// import { NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";
// import { prisma } from "@/lib/prisma";

// export async function GET() {
//   const results: string[] = [];
//   const skipped: string[] = [];

//   // Get all image URLs currently in DB
//   const dbUsers = await prisma.user.findMany({
//     select: { image: true, email: true },
//     where: { image: { not: null } },
//   });

//   // Extract just the filenames in use e.g. "profile.jpg"
//   const activeUserPaths = new Set(
//     dbUsers.map(u => {
//       try {
//         const url = new URL(u.image!);
//         return decodeURIComponent(url.pathname.split("/profile-images/")[1]);
//       } catch { return null; }
//     }).filter(Boolean)
//   );

//   // Clean profile-images
//   const { data: userFolders } = await supabaseAdmin.storage
//     .from("profile-images")
//     .list();

//   for (const folder of userFolders ?? []) {
//     const { data: files } = await supabaseAdmin.storage
//       .from("profile-images")
//       .list(folder.name);

//     for (const f of files ?? []) {
//       const fullPath = `${folder.name}/${f.name}`;
//       if (f.name === "profile.jpg" || activeUserPaths.has(fullPath)) {
//         skipped.push(`KEPT: ${fullPath}`);
//         continue;
//       }
//       await supabaseAdmin.storage.from("profile-images").remove([fullPath]);
//       results.push(`Deleted: ${fullPath}`);
//     }
//   }

//   // Get active logo from DB
//   const bizProfile = await prisma.mtbBusinessProfile.findFirst({
//     select: { logoUrl: true },
//   });
//   const activeLogoPath = bizProfile?.logoUrl
//     ? decodeURIComponent(new URL(bizProfile.logoUrl).pathname.split("/mtb-logos/")[1])
//     : null;

//   // Clean mtb-logos
//   const { data: logoFiles } = await supabaseAdmin.storage
//     .from("mtb-logos")
//     .list("business-profile");

//   for (const f of logoFiles ?? []) {
//     const fullPath = `business-profile/${f.name}`;
//     if (f.name === "logo.jpg" || fullPath === activeLogoPath) {
//       skipped.push(`KEPT: ${fullPath}`);
//       continue;
//     }
//     await supabaseAdmin.storage.from("mtb-logos").remove([fullPath]);
//     results.push(`Deleted: ${fullPath}`);
//   }

//   return NextResponse.json({ done: true, deleted: results, kept: skipped });
// }