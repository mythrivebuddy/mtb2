// app/api/spotlight/unseen-count/route.js
// import { prisma } from "@/lib/prisma";

// export async function GET() {
//   try {
//     const count = await prisma.spotlight.count({
//       where: { seenByAdmin: false, status: "APPLIED" }, 
//     });

//     return Response.json({ count });
//   } catch (err) {
//     console.error("Unseen spotlight count error:", err);
//     return Response.json({ error: "Failed to fetch" }, { status: 500 });
//   }
// }
