"use client";
import type { Category } from "@prisma/client";

export function CategoryList({ categories }: { categories: Category[] }) {
    const handleDelete = async (id: string, name: string) => {
        // Confirmation dialog to prevent accidental deletion
        if (confirm(`Are you sure you want to delete the category "${name}"? This will also delete all questions associated with it.`)) {
            try {
                await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                alert(`Category "${name}" was deleted.`);
                window.location.reload(); // Reload to update the list
            } catch (error) {
                alert("Failed to delete the category.");
                console.error("Error deleting category:", error);
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Categories</h2>
            <div className="space-y-2">
                {categories.length > 0 ? (
                    categories.map((category) => (
                        <div key={category.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                            <span className="font-medium text-gray-800">{category.name}</span>
                            <button 
                                onClick={() => handleDelete(category.id, category.name)} 
                                className="text-red-600 hover:text-red-800 font-semibold text-sm"
                            >
                              Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No categories found. Add one to get started!</p>
                )}
    
            </div>

        </div>
    );
}
