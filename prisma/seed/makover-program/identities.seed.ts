/// Seeds identity statements per area (editable by admin later)
import { prisma } from "@/lib/prisma";

type IdentitySeed = {
  areaId: number;
  statements: string[];
};

const IDENTITIES: IdentitySeed[] = [
  // 1️⃣ Health & Fitness
  {
    areaId: 1,
    statements: [
      "I am a person who prioritizes my health daily",
      "I am disciplined with my body, food, and movement",
      "I respect my body and listen to its needs",
      "I am consistent with physical activity",
      "I make healthy choices effortlessly",
      "I am energetic, strong, and resilient",
      "I recover quickly and care for my body well",
      "I value long-term health over short-term comfort",
      "I am committed to improving my physical fitness",
      "I feel confident and comfortable in my body",
    ],
  },

  // 2️⃣ Mindset & Emotional Wellbeing
  {
    areaId: 2,
    statements: [
      "I am calm and emotionally balanced",
      "I respond thoughtfully rather than reacting emotionally",
      "I manage stress with clarity and control",
      "I trust myself and my inner voice",
      "I am mentally strong and resilient",
      "I release overthinking and stay present",
      "I speak to myself with kindness and respect",
      "I handle challenges with emotional maturity",
      "I feel safe and grounded within myself",
      "I choose peace over unnecessary worry",
    ],
  },

  // 3️⃣ Relationships
  {
    areaId: 3,
    statements: [
      "I communicate honestly and openly",
      "I build relationships based on trust and respect",
      "I listen deeply and empathetically",
      "I express love clearly and confidently",
      "I maintain healthy boundaries in relationships",
      "I attract emotionally healthy relationships",
      "I invest time and energy in meaningful connections",
      "I handle conflicts with maturity and compassion",
      "I am emotionally available and present",
      "I nurture relationships that support my growth",
    ],
  },

  // 4️⃣ Career & Business Growth
  {
    areaId: 4,
    statements: [
      "I take ownership of my career growth",
      "I act with professionalism and discipline",
      "I consistently improve my skills and performance",
      "I take initiative and responsibility at work",
      "I execute my work with focus and excellence",
      "I am confident in my professional abilities",
      "I build long-term value through my work",
      "I manage my time and priorities effectively",
      "I am reliable and results-oriented",
      "I grow steadily in my career or business",
    ],
  },

  // 5️⃣ Wealth & Finance
  {
    areaId: 5,
    statements: [
      "I am responsible and intentional with money",
      "I manage my finances with clarity and control",
      "I make conscious spending decisions",
      "I save and invest consistently",
      "I respect money and use it wisely",
      "I plan my finances for the long term",
      "I avoid impulsive financial behavior",
      "I am building financial stability step by step",
      "I feel confident handling money matters",
      "I align my spending with my values",
    ],
  },

  // 6️⃣ Social Life & Influence
  {
    areaId: 6,
    statements: [
      "I communicate confidently and clearly",
      "I am comfortable expressing my thoughts and ideas",
      "I build meaningful social connections",
      "I show up authentically in social settings",
      "I am respected for how I communicate",
      "I add value to conversations and communities",
      "I engage with people openly and positively",
      "I build influence through consistency and integrity",
      "I am socially confident and approachable",
      "I connect easily with new people",
    ],
  },

  // 7️⃣ Skills & Intelligence
  {
    areaId: 7,
    statements: [
      "I am a lifelong learner",
      "I learn new skills with discipline and focus",
      "I apply what I learn consistently",
      "I think clearly and strategically",
      "I improve my skills every week",
      "I value mastery over shortcuts",
      "I enjoy learning and intellectual growth",
      "I stay curious and mentally sharp",
      "I invest time in building expertise",
      "I trust my ability to learn anything",
    ],
  },

  // 8️⃣ Lifestyle & Personal Upgrades
  {
    areaId: 8,
    statements: [
      "I live intentionally and by design",
      "I manage my time and energy well",
      "I maintain structured daily routines",
      "I create systems that support my life",
      "I keep my environment organized",
      "I am consistent with healthy habits",
      "I reduce distractions and stay focused",
      "I upgrade my lifestyle step by step",
      "I value discipline in daily life",
      "I take control of how I live each day",
    ],
  },

  // 9️⃣ Spiritual Growth
  {
    areaId: 9,
    statements: [
      "I live in alignment with my values",
      "I am deeply connected to myself",
      "I cultivate inner peace daily",
      "I observe my thoughts without attachment",
      "I live with awareness and presence",
      "I seek meaning beyond material success",
      "I grow through reflection and introspection",
      "I trust the journey of my life",
      "I act with compassion and integrity",
      "I feel grounded and centered within",
    ],
  },
];

export async function seedMakeoverIdentities() {
  for (const group of IDENTITIES) {
    for (const statement of group.statements) {
      await prisma.makeoverIdentityLibrary.upsert({
        where: {
          areaId_statement: {
            areaId: group.areaId,
            statement,
          },
        },
        update: {}, // never mutate admin-seeded data
        create: {
          areaId: group.areaId,
          statement,
          isCustom: false,
        },
      });
    }
  }
}
