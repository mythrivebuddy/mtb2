// prisma/notificationSeedData.ts
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma"

const CMP_NOTIFICATION_SEEDS: {
    type: NotificationType;
    title: string;
    message: string;
    url: string;
    isDynamic: boolean;
}[] = [
        // 1️ DAILY (Mon–Sat)
        {
            type: "CMP_DAILY_PRIMARY",
            title: "🔔 Today’s CMP Card is waiting",
            message: "Complete your Identity, Action & Win for today.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },
        {
            type: "CMP_DAILY_GENTLE_NUDGE",
            title: "⏳ Still time for today’s CMP progress",
            message: "One small action is enough.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },

        // 2️ SUNDAY
        {
            type: "CMP_SUNDAY_MORNING",
            title: "🧭 Sunday Reflection Day",
            message: "Review your week & set next week’s focus.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },
        {
            type: "CMP_SUNDAY_EVENING_PENDING",
            title: "📝 Don’t miss your weekly reflection",
            message: "This unlocks your full weekly points.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },

        // 3️⃣ QUARTERLY
        {
            type: "CMP_QUARTER_ENDING_SOON",
            title: "🔄 Quarter ending soon",
            message: "Get ready to review & reset your identity.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: false,
        },
        {
            type: "CMP_QUARTER_RESET",
            title: "🚀 New Quarter, New Identity",
            message: "Choose your identity & action for this quarter.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: false,
        },

        // 4️ REWARDS
        {
            type: "CMP_REWARD_UNLOCKED",
            title: "🎉 You unlocked a Self-Reward!",
            message: "Claim it and celebrate your progress.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: false,
        },
        {
            type: "CMP_REWARD_UNCLAIMED",
            title: "🎁 Your reward is still waiting",
            message: "Take a moment to celebrate.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: false,
        },

        // 5️ LEVEL UP
        {
            type: "CMP_LEVEL_UP",
            title: "🏅 You reached Level {{levelNumber}} — {{levelName}}",
            message: "Your consistency is paying off.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: true,
        },

        // 6️ GOA JOURNEY
        {
            type: "CMP_GOA_PROGRESS_MILESTONE",
            title: "🌴 You’re {{goaProgressMilestone}}% on your Goa Journey",
            message: "Keep going — you’re closer than you think.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: true,
        },
        {
            type: "CMP_GOA_ELIGIBLE",
            title: "🌟 You’re now eligible for the Goa Event!",
            message: "What a journey this has been.",
            url: "/dashboard/complete-makeover-program/makeover-dashboard",
            isDynamic: false,
        },

        // 7️ INACTIVITY
        {
            type: "CMP_INACTIVITY_3_DAYS",
            title: "👋 We saved your progress",
            message: "Pick up where you left off — just one step today.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },
        {
            type: "CMP_INACTIVITY_7_DAYS",
            title: "🔁 Your CMP journey is still open",
            message: "It’s never about perfection — just restart.",
            url: "/dashboard/complete-makeover-program/todays-actions",
            isDynamic: false,
        },

        // 8️ ONBOARDING
        {
            type: "CMP_ONBOARDING_PENDING",
            title: "👣 Start with today’s card",
            message: "CMP works one day at a time.",
            url: "/dashboard/complete-makeover-program/onboarding",
            isDynamic: false,
        },
    ];


async function main() {
    for (const seed of CMP_NOTIFICATION_SEEDS) {
        const exists = await prisma.notificationSettings.findUnique({
            where: { notification_type: seed.type },
            select: { id: true },
        });

        //  If already exists → do nothing (admin edits needs to preserved preserved)
        if (exists) continue;

        await prisma.notificationSettings.create({
            data: {
                notification_type: seed.type,
                title: seed.title,
                message: seed.message,
                url: seed.url,
                isDynamic: seed.isDynamic,
            },
        });
    }

    console.log("✅ CMP notifications seeded");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());