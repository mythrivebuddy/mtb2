import { NextResponse } from "next/server";
import { UNLIMITED } from "./featureConfig";

//! Enforces numeric limits and returns a Response if it is  blocked. Returns null if allowed.

export async function enforceLimitResponse(params: {
    limit: number;
    currentCount: number;
    message?: string;
    statusCode?: number;
    isUpgradeFlagShow?: boolean;
}) {
    const {
        limit,
        currentCount,
        message = "Upgrade required",
        statusCode = 403,
        isUpgradeFlagShow 
    } = params;

    if (limit === UNLIMITED) {
        return null;
    }

    if (currentCount >= limit) {
        return NextResponse.json(
            { message,isUpgradeFlagShow },
            { status: statusCode }
        );
    }

    return null;
}
