import { ActivityType, PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

// * this seed script is meant for production as well
async function main() {
  const activities = [
    {
      activity: ActivityType.SIGNUP,
      jpAmount: 500,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.DAILY_LOGIN,
      jpAmount: 50,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.QUIZ_CORRECT,
      jpAmount: 10,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.ADD_LOG,
      jpAmount: 20,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.SPOTLIGHT,
      jpAmount: 5000,
      transactionType: TransactionType.DEBIT,
    },
    {
      activity: ActivityType.PROSPERITY_DROP,
      jpAmount: 5000,
      transactionType: TransactionType.DEBIT,
    },
    {
      activity: ActivityType.BUSINESSPROFILE_COMPLETE,
      jpAmount: 100,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.MIRACLE_LOG,
      jpAmount: 50,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.PROGRESS_VAULT,
      jpAmount: 50,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.REFER_BY,
      jpAmount: 500,
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.REFER_TO,
      jpAmount: 500,
      transactionType: TransactionType.CREDIT,
    }, {
      // ! there will be two activity type one fror sender and one for receiver
      activity: ActivityType.MAGIC_BOX,
      jpAmount: 0, // will be handles by trnasection only  //! since here jp is not considered then many be turn it to non-required field
      transactionType: TransactionType.CREDIT,
    },
    {
      activity: ActivityType.GENERAL_FEEDBACK,
      jpAmount: 50,
      transactionType: TransactionType.CREDIT,
    },

    {
      activity: ActivityType.FEATURE_REQUEST,
      jpAmount: 100,
      transactionType: TransactionType.CREDIT,
    },

    {
      activity: ActivityType.BUG_REPORT,
      jpAmount: 150,
      transactionType: TransactionType.CREDIT,
    }

  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { activity: activity.activity },
      update: {
        // jpAmount: activity.jpAmount,
        // transactionType: activity.transactionType,
      },
      create: activity,
    });
  }

  console.log("Seed data for activities inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
