"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
//import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { CategoryWithQuestions } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import Image from "next/image";

// 👇 Include image field in Zod schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }),
  image: z.any().optional(),
});

export function CategoryManager({ categories: initialCategories }: { categories: CategoryWithQuestions[] }) {
  
  const [categories, setCategories] = useState<CategoryWithQuestions[]>(initialCategories);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithQuestions | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", image: null },
  });

  const { isSubmitting } = form.formState;

  // Load categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("localCategories");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
      } catch (err) {
        console.error("Failed to parse local categories", err);
      }
    }
  }, []);

  // Save to localStorage
  const syncToLocalStorage = (data: CategoryWithQuestions[]) => {
    setCategories(data);
    localStorage.setItem("localCategories", JSON.stringify(data));
  };

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.image && data.image.length > 0) {
        formData.append("image", data.image[0]);
      }

      const res = await fetch("/api/survey/category/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create category");
      const newCategory = await res.json();

      const updated = [...categories, { ...newCategory, questions: [] }];
      syncToLocalStorage(updated);
      form.reset();
      setPreview(null);
      toast.success("Category created!");
    } catch (err) {
      console.error(err);
      toast.error("Error creating category.");
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/survey/category/${categoryToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      const updated = categories.filter(c => c.id !== categoryToDelete.id);
      syncToLocalStorage(updated);
      toast.success("Deleted category!");
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., HR, Design" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { onChange, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Upload Image</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPreview(URL.createObjectURL(file));
                              }
                              onChange(e.target.files);
                            }}
                            {...rest}
                          />
                        </FormControl>
                        {preview && (
                          <Image
                            src={preview}
                            alt="Preview"
                            className="mt-2 w-20 h-20 object-cover rounded-md"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Category List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {cat.image && (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      )}
                      <span>{cat.name}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCategoryToDelete(cat)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No categories yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-red-500">{categoryToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
