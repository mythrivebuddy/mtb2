import { NOTIFICATION_CATEGORIES } from "@/lib/constants/notification-categories";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/* ==================================================
   🧠 SHARED ENGINE (CORE LOGIC)
================================================== */
async function computeAndApplyDiff(
  userId: string,
  updates: Map<NotificationType, boolean>,
) {
  const allTypes = [
    ...NOTIFICATION_CATEGORIES.system_notifications,
    ...NOTIFICATION_CATEGORIES.other_notifications,
    ...Object.values(NOTIFICATION_CATEGORIES.feature_notifications).flat(),
  ] as NotificationType[];

  const [existingPrefs, user] = await Promise.all([
    prisma.userNotificationPreference.findMany({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { notificationMode: true },
    }),
  ]);

  const existingMap = new Map(existingPrefs.map((p) => [p.type, p.enabled]));
  const currentMode = user?.notificationMode ?? "ALL_ON";

  const defaultEnabled = currentMode === "ALL_ON";

  /* ---------------- BUILD CURRENT STATE ---------------- */
  const currentState = new Map<NotificationType, boolean>();

  allTypes.forEach((t) => {
    currentState.set(t, existingMap.get(t) ?? defaultEnabled);
  });

  /* ---------------- APPLY UPDATES ---------------- */
  updates.forEach((val, type) => {
    currentState.set(type, val);
  });

  /* ---------------- COUNT ---------------- */
  let enabledCount = 0;
  let disabledCount = 0;

  currentState.forEach((v) => (v ? enabledCount++ : disabledCount++));

  /* ---------------- CHOOSE MODE ---------------- */
  const mode = disabledCount <= enabledCount ? "ALL_ON" : "ALL_OFF";

  /* ---------------- BUILD OPTIMAL SET ---------------- */
  const newSet = new Map<NotificationType, boolean>();

  currentState.forEach((v, t) => {
    if (mode === "ALL_ON" && v === false) newSet.set(t, false);
    if (mode === "ALL_OFF" && v === true) newSet.set(t, true);
  });

  const oldSet = new Map(existingPrefs.map((p) => [p.type, p.enabled]));

  const toDelete: NotificationType[] = [];
  const toInsert: { type: NotificationType; enabled: boolean }[] = [];

  oldSet.forEach((_, t) => {
    if (!newSet.has(t)) toDelete.push(t);
  });

  newSet.forEach((val, t) => {
    const oldVal = oldSet.get(t);

    // ✅ insert new
    if (oldVal === undefined) {
      toInsert.push({ type: t, enabled: val });
    }

    // ✅ update existing (value changed)
    else if (oldVal !== val) {
      toDelete.push(t); // remove old
      toInsert.push({ type: t, enabled: val }); // insert new
    }
  });

  const modeUnchanged = mode === currentMode;

  /* ---------------- EARLY EXIT ---------------- */
  if (!toDelete.length && !toInsert.length && modeUnchanged) {
    return {
      skipped: true,
      stats: { mode, inserted: 0, deleted: 0 },
    };
  }

  /* ---------------- APPLY DB OPS ---------------- */
  await prisma.$transaction([
    ...(toDelete.length
      ? [
          prisma.userNotificationPreference.deleteMany({
            where: { userId, type: { in: toDelete } },
          }),
        ]
      : []),

    ...(toInsert.length
      ? [
          prisma.userNotificationPreference.createMany({
            data: toInsert.map((i) => ({
              userId,
              type: i.type,
              enabled: i.enabled,
            })),
          }),
        ]
      : []),

    ...(modeUnchanged
      ? []
      : [
          prisma.user.update({
            where: { id: userId },
            data: { notificationMode: mode },
          }),
        ]),
  ]);

  return {
    skipped: false,
    stats: {
      mode,
      inserted: toInsert.length,
      deleted: toDelete.length,
    },
  };
}

/* ==================================================
   GET
================================================== */
export const GET = async () => {
  try {
    const session = await checkRole(["ADMIN", "USER"]);
    const userId = session.user.id;

    const [templates, prefs, user] = await Promise.all([
      prisma.notificationSettings.findMany(),
      prisma.userNotificationPreference.findMany({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { notificationMode: true },
      }),
    ]);

    const prefMap = new Map(prefs.map((p) => [p.type, p.enabled]));
    const mode = user?.notificationMode ?? "ALL_ON";

    const resolveEnabled = (type: NotificationType) =>
      mode === "ALL_ON"
        ? (prefMap.get(type) ?? true)
        : (prefMap.get(type) ?? false);

    const map = new Map(
      templates.map((t) => [
        t.notification_type,
        { ...t, enabled: resolveEnabled(t.notification_type) },
      ]),
    );

    const feature = Object.entries(
      NOTIFICATION_CATEGORIES.feature_notifications,
    ).map(([groupName, types]) => ({
      groupName,
      items: types.map((t) => map.get(t)).filter(Boolean),
    }));

    const system = NOTIFICATION_CATEGORIES.system_notifications
      .map((t) => map.get(t))
      .filter(Boolean);

    const others = NOTIFICATION_CATEGORIES.other_notifications
      .map((t) => map.get(t))
      .filter(Boolean);

    return NextResponse.json({ data: { feature, system, others } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};

/* ==================================================
   PATCH (single)
================================================== */
export const PATCH = async (req: NextRequest) => {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;

    const { type, enabled } = await req.json();

    if (!type || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 },
      );
    }

    const updates = new Map<NotificationType, boolean>();
    updates.set(type, enabled);

    const result = await computeAndApplyDiff(userId, updates);

    return NextResponse.json({
      message: result.skipped ? "No change" : "Single update optimized",
      stats: result.stats,
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};

/* ==================================================
   PUT (bulk)
================================================== */
export const PUT = async (req: NextRequest) => {
  try {
    const session = await checkRole("USER");
    const userId = session.user.id;

    const { types, enabled } = await req.json();

    if (!Array.isArray(types) || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validTypes = Object.values(NotificationType);

    const invalid = types.filter((t) => !validTypes.includes(t));
    if (invalid.length) {
      return NextResponse.json(
        { error: "Invalid notification types", invalid },
        { status: 400 },
      );
    }

    const updates = new Map<NotificationType, boolean>();
    types.forEach((t) => updates.set(t, enabled));

    const result = await computeAndApplyDiff(userId, updates);

    return NextResponse.json({
      message: result.skipped ? "No change" : "Bulk update optimized",
      stats: result.stats,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};

// | Step | Disabled | Enabled | Mode Chosen  | What We Store | Rows Stored |
// | ---- | -------- | ------- | ------------ | ------------- | ----------- |
// | 1    | 0        | 44      | ALL_ON       | nothing       | 0           |
// | 2    | 5        | 39      | ALL_ON       | 5 disabled    | 5           |
// | 3    | 10       | 34      | ALL_ON       | 10 disabled   | 10          |
// | 4    | 20       | 24      | ALL_ON       | 20 disabled   | 20          |
// | 5    | 22       | 22      | ALL_ON (tie) | 22 disabled   | 22          |
// | 6    | 25       | 19      | ALL_OFF 🔁   | 19 enabled    | 19          |
// | 7    | 30       | 14      | ALL_OFF      | 14 enabled    | 14          |
// | 8    | 35       | 9       | ALL_OFF      | 9 enabled     | 9           |
// | 9    | 40       | 4       | ALL_OFF      | 4 enabled     | 4           |
// | 10   | 43       | 1       | ALL_OFF      | 1 enabled     | 1           |
// | 11   | 44       | 0       | ALL_OFF      | nothing       | 0           |
