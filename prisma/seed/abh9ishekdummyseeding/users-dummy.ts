import { PrismaClient, Role } from "@prisma/client";



console.log("🔥 USERS DUMMY SEED STARTED 🔥");

const prisma = new PrismaClient();

async function main() {
  console.log("👤 Seeding dummy users...");

  await prisma.user.createMany({
    data: [
      {
        id: "user_dummy_1",
        email: "dummy1@example.com",
        name: "Dummy User One",
        role: Role.USER,
        membership: "FREE",
        jpEarned: 100,
        jpBalance: 40,
        isOnline: true,
      },
      {
        id: "user_dummy_2",
        email: "dummy2@example.com",
        name: "Dummy User Two",
        role: Role.USER,
        membership: "FREE",
        jpEarned: 250,
        jpBalance: 120,
        isOnline: false,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Dummy users seeded");
}

main()
  .catch((e) => {
    console.error("❌ User seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
console.log("✅ USERS DUMMY SEED FINISHED ✅");
