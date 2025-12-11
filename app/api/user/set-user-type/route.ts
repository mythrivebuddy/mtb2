import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { role } = await req.json();
        const session = await getServerSession(authOptions);

        const validRoles = ["COACH", "ENTHUSIAST"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const user = session?.user;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.user.update({
            where: { id: user.id },
            data: { userType: role },
        });

        return NextResponse.json({ success: true, message: `Your role has been updated to ${role}` }, { status: 200 });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }

}
