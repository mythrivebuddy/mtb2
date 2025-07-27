"use client";

import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Trash2, PlusCircle } from "lucide-react";

import { CategoryWithQuestions } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

type QuestionWithCategory = {
  id: string;
  name: string;
  options: string[];
  category: { name: string };
};

const formSchema = z.object({
  text: z.string().min(1, "Question text is required."),
  categoryId: z.string({ required_error: "Please select a category." }),
  options: z.array(
    z.object({ value: z.string().min(1, "Option cannot be empty.") })
  ).min(2, "At least two options are required."),
});

type FormValues = z.infer<typeof formSchema>;

type QuestionManagerProps = {
  questions: QuestionWithCategory[];
  categories: CategoryWithQuestions[];
  mutateQuestions?: () => void;
};

export function QuestionManager({ questions, categories, mutateQuestions }: QuestionManagerProps) {
  const router = useRouter();
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithCategory | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      options: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const payload = {
      ...data,
      options: data.options.map((o) => o.value),
    };

    try {
      const response = await fetch("/api/survey/question/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Server responded with an error.");

      toast.success("Question added successfully!");
      form.reset();

      if (mutateQuestions) {
        mutateQuestions();
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Failed to add question.");
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      const response = await fetch(`/api/survey/question/${questionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Server responded with an error.");

      toast.success("Question deleted successfully!");

      if (mutateQuestions) {
        mutateQuestions();
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete question.");
    } finally {
      setQuestionToDelete(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Which department are you in?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Options</FormLabel>
                    <div className="space-y-3 mt-2">
                      {fields.map((field, index) => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input placeholder={`Option ${index + 1}`} {...field} />
                                </FormControl>
                                {fields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => append({ value: "" })}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? "Saving..." : "Save Question"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length > 0 ? (
                questions.map((q) => (
                  <Card key={q.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{q.name}</CardTitle>
                      <CardDescription>Category: {q.category.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {q.options?.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => setQuestionToDelete(q)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No questions found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question:{" "}
              <strong>&quot;{questionToDelete?.name}&quot;</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
