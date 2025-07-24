import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; // 1. Import revalidatePath

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ message: "Category name is required" }, { status: 400 });
        }
        const newCategory = await prisma.category.create({
            data: { name },
        });

        // 2. Add this line to clear the cache for the admin categories page
        revalidatePath('/admin/categories');

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ message: "Failed to create category" }, { status: 500 });
    }
}
