import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FeatureSchema } from "@/schema/zodSchema";
import { checkRole } from "@/lib/utils/auth";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    await checkRole("ADMIN");

    const features = await prisma.feature.findMany({
      include: { planConfigs: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: features });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await checkRole("ADMIN");
    const body = await req.json();

    const validation = FeatureSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existing = await prisma.feature.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      return NextResponse.json(
        { errors: { key: ["Feature key already exists"] } },
        { status: 409 }
      );
    }

    const feature = await prisma.feature.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        configSchema:
          data.configSchema === null
            ? Prisma.JsonNull
            : (data.configSchema as Prisma.InputJsonValue),
        allowedUserTypes: data.allowedUserTypes,
        actions:
          data.actions === null
            ? Prisma.JsonNull
            : (data.actions as Prisma.InputJsonValue),
        isActive: data.isActive,
        planConfigs: {
          create: data.planConfigs.map(
            (pc: (typeof data.planConfigs)[number]) => ({
              membership: pc.membership,
              userType: pc.userType,
              isActive: pc.isActive,
              config:
                pc.config === null
                  ? Prisma.JsonNull
                  : (pc.config as Prisma.InputJsonValue),
            })
          ),
        },
      },
      include: { planConfigs: true },
    });

    await prisma.featureConfigAudit.createMany({
      data: feature.planConfigs.map((pc) => ({
        configId: pc.id,
        oldConfig: Prisma.JsonNull,
        newConfig:
          pc.config === null
            ? Prisma.JsonNull
            : (pc.config as Prisma.InputJsonValue),
        updatedBy: session.user.id,
        note: "Initial config creation",
      })),
    });

    return NextResponse.json({ success: true, data: feature }, { status: 201 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}