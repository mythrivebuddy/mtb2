// scripts/updateUserPlan.ts
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  // --- 1. YOUR IDs ARE CONFIGURED HERE ---
  
  // This is the correct user ID from your logs.
  const userIdToUpdate = 'f1cb57c5-b33f-48af-a562-a9c54013edd2'; 
  
  // This is the correct plan ID you found in your database.
  const planIdToAssign = '42dd8f14-3efc-47cd-b388-6a34f82f1159'; 
  // --- END OF CONFIGURATION ---

  console.log(`Attempting to update user: ${userIdToUpdate}`);
  console.log(`Assigning plan ID: ${planIdToAssign}`);

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userIdToUpdate,
      },
      data: {
        planId: planIdToAssign,
      },
    });

    console.log('\n✅ Success! User has been updated.');
    console.log('Updated User Details:', {
      id: updatedUser.id,
      email: updatedUser.email,
      planId: updatedUser.planId,
    });
  } catch (error) {
    console.error('\n❌ Error updating user:', error);
    console.log('\nPlease double-check that both the user ID and the plan ID are correct and exist in your database.');
  } finally {
    await prisma.$disconnect();
  }
}

main();

