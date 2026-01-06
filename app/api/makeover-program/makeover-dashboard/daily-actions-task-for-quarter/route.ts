import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantProgramAccess } from "@/lib/utils/makeover-program/access/grantProgramAccess";
import { AccessError } from "@/lib/utils/makeover-program/access/AccessError";

export const GET = async () => {
    try {
        const { userId, programId } = await grantProgramAccess();

        const selectedAreas = await prisma.userMakeoverArea.findMany({
            where: {
                userId,
                programId,
            },
            select: {
                areaId: true,
                area: {
                    select: {
                        name: true,
                        description:true
                    },
                },
            },
        });

        if (selectedAreas.length === 0) {
            return NextResponse.json(
                { error: "No areas selected for this quarter" },
                { status: 404 }
            );
        }

        // --- FIX STARTS HERE ---
        // 1. Map the database result to a clean array of objects { id, name }
        const areas = selectedAreas.map((a) => ({
            id: a.areaId,
            name: a.area?.name || `Area ${a.areaId}`, // Safety fallback
            description: a.area?.description || "",
        }));
        
        // 2. Extract IDs specifically for the next query
        const areaIds = selectedAreas.map((a) => a.areaId);
        // --- FIX ENDS HERE ---

        const dailyActions = await prisma.makeoverDailyActionLibrary.findMany({
            where: {
                isCustom: false,
                areaId: {
                    in: areaIds,
                },
            },
        });

        return NextResponse.json(
            // 3. Return 'areas' (with names) instead of just 'areaIds'
            { success: true, areas, dailyActions }, 
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof AccessError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error("DAILY ACTIONS DASHBOARD ERROR:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};