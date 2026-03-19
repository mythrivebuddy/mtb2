import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FeatureSchema } from "@/schema/zodSchema";
import { checkRole } from "@/lib/utils/auth";
import { Prisma } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await checkRole("ADMIN");
    const { id } = await params;
    const body = await req.json();

    const validation = FeatureSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      include: { planConfigs: true },
    });

    if (!existingFeature) {
      return new NextResponse("Feature not found", { status: 404 });
    }

    if (data.key !== existingFeature.key) {
      const keyCheck = await prisma.feature.findUnique({
        where: { key: data.key },
      });
      if (keyCheck) {
        return NextResponse.json(
          { errors: { key: ["This key is already in use"] } },
          { status: 409 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.feature.update({
        where: { id },
        data: {
          name: data.name,
          key: data.key,
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
        },
      });

      const existingMap = new Map(
        existingFeature.planConfigs.map((pc) => [
          `${pc.membership}_${pc.userType}`,
          pc,
        ])
      );

      const incomingKeys = new Set<string>();

      for (const incomingPc of data.planConfigs) {
        const key = `${incomingPc.membership}_${incomingPc.userType}`;
        incomingKeys.add(key);

        const existingPc = existingMap.get(key);

        if (existingPc) {
          const configChanged =
            JSON.stringify(existingPc.config) !==
            JSON.stringify(incomingPc.config);

          await tx.featurePlanConfig.update({
            where: { id: existingPc.id },
            data: {
              isActive: incomingPc.isActive,
              config:
                incomingPc.config === null
                  ? Prisma.JsonNull
                  : (incomingPc.config as Prisma.InputJsonValue),
            },
          });

          if (configChanged) {
            await tx.featureConfigAudit.create({
              data: {
                configId: existingPc.id,
                oldConfig:
                  existingPc.config === null
                    ? Prisma.JsonNull
                    : (existingPc.config as Prisma.InputJsonValue),
                newConfig:
                  incomingPc.config === null
                    ? Prisma.JsonNull
                    : (incomingPc.config as Prisma.InputJsonValue),
                updatedBy: session.user.id,
                note: "Updated via Admin Dashboard",
              },
            });
          }
        } else {
          const created = await tx.featurePlanConfig.create({
            data: {
              featureId: id,
              membership: incomingPc.membership,
              userType: incomingPc.userType,
              isActive: incomingPc.isActive,
              config:
                incomingPc.config === null
                  ? Prisma.JsonNull
                  : (incomingPc.config as Prisma.InputJsonValue),
            },
          });

          await tx.featureConfigAudit.create({
            data: {
              configId: created.id,
              oldConfig: Prisma.JsonNull,
              newConfig:
                incomingPc.config === null
                  ? Prisma.JsonNull
                  : (incomingPc.config as Prisma.InputJsonValue),
              updatedBy: session.user.id,
              note: "Initial config creation",
            },
          });
        }
      }

      for (const existingPc of existingFeature.planConfigs) {
        const key = `${existingPc.membership}_${existingPc.userType}`;
        if (!incomingKeys.has(key)) {
          await tx.featurePlanConfig.delete({
            where: { id: existingPc.id },
          });
        }
      }
    });

    const finalFeature = await prisma.feature.findUnique({
      where: { id },
      include: { planConfigs: true },
    });

    return NextResponse.json({ success: true, data: finalFeature });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}