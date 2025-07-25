import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./(component)/CategoryForm";
import { CategoryList } from "./(component)/CategoryList";

// This is a Server Component, so it can fetch data directly.
export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column for the form */}
        <div className="lg:col-span-1">
          <CategoryForm />
        </div>
        {/* Column for the list of existing categories */}
        <div className="lg:col-span-2">
          <CategoryList categories={categories} />
        </div>
      </div>
    </div>
  );
}
