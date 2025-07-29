'use client';

import { useState, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { CategoryType, QuestionType } from '../page';

type Props = {
  categories: CategoryType[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryType[]>>;
  questions: QuestionType[];
};

export default function CategoryManager({
  categories,
  setCategories,
  questions,
}: Props) {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a category image');
      return;
    }

    const newCategory: CategoryType = {
      id: crypto.randomUUID(),
      name,
      imageUrl: imagePreview || '', // In real apps, upload image to server
    };

    setCategories([...categories, newCategory]);
    setName('');
    setImageFile(null);
    setImagePreview(null);
    toast.success('Category added successfully');
  };

  const handleDelete = (id: string) => {
    const usedInQuestions = questions.some((q) => q.categoryId === id);
    if (usedInQuestions) {
      toast.error('Cannot delete. Category is used in a question.');
      return;
    }

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setCategories(categories.filter((cat) => cat.id !== id));
          resolve('Deleted');
        }, 300);
      }),
      {
        loading: 'Deleting...',
        success: 'Category deleted!',
        error: 'Failed to delete',
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-24 h-24 object-cover rounded border"
          />
        )}

        <Button onClick={handleAdd}>Add Category</Button>

        <div className="pt-6 space-y-4">
          {categories.length === 0 && (
            <p className="text-muted-foreground text-sm">No categories added yet</p>
          )}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between border p-3 rounded-md shadow-sm"
            >
              <div className="flex items-center gap-4">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.id}</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => handleDelete(cat.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
