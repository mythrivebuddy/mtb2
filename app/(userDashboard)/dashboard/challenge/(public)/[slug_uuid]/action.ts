"use server";

// This file isolates the database logic.
// It fetches data on the server, returning full Prisma objects with Date types.

import { prisma } from "@/lib/prisma";
import { cache } from 'react';

export const getChallengeData = cache(async (slug_uuid: string) => {
    const parts = slug_uuid.split('-');
    const uuid = parts[parts.length - 1];

    if (!uuid) {
        return null;
    }

    try {
        const challenge = await prisma.challenge.findUnique({
            where: { id: uuid },
            include: {
                creator: { select: { name: true } },
                templateTasks: { select: { id: true, description: true } },
                _count: { select: { enrollments: true } },
            }
        });
        return challenge;
    } catch (error) {
        console.error("Database error in getChallengeData:", error);
        return null;
    }
});