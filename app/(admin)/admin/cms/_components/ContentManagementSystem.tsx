"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CMSPage = {
  id: string;
  isPublished: boolean;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaMarkup?: any;
  schemaType?: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  authorId: string;
};

export default function CMSPageList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<CMSPage | null>(null);

  const pagesQuery = useQuery({
    queryKey: ["cms-pages"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/cms");
      return res.data;
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/admin/cms/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success("Page deleted");
      setDeleteTarget(null);
    },
  });

  const publishToggleToSaveToDraft = useMutation({
    mutationFn: async (page: CMSPage) => {
      const isPublished = !page.isPublished;
      const res = await axios.put(`/api/admin/cms/${page.id}`, { isPublished });
      return res.data;
    },
    onSuccess: (_, page) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success(
        page.isPublished
          ? `${page.title} has been unpublished (Draft)`
          : `${page.title} has been published`
      );
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Content Management</h1>

        <Link href="/admin/cms/manage-create-edit">
          <Button className="font-medium">+ Create Page</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pagesQuery.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center">
                  No pages found.
                </TableCell>
              </TableRow>
            ) : (
              pagesQuery.data.map((p: CMSPage) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell className="font-mono text-sm">/{p.slug}</TableCell>

                  {/* Status */}
                  <TableCell>
                    <button
                      onClick={() => publishToggleToSaveToDraft.mutate(p)}
                      disabled={publishToggleToSaveToDraft.isPending}
                    >
                      {p.isPublished ? (
                        <Badge className="bg-green-600">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </button>
                  </TableCell>

                  <TableCell>
                    {new Date(p.updatedAt || p.createdAt).toLocaleString()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="flex gap-2">
                    <Link href={`/admin/cms/manage-create-edit?id=${p.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>

                    <Link href={`/${p.slug}`} target="_blank">
                      <Button variant="secondary" size="sm">
                        Preview
                      </Button>
                    </Link>

                    {/* DELETE Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                        >
                          Delete
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Page?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{deleteTarget?.title}</strong>? This action
                            cannot be undone.
                          </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>

                          <Button
                            variant="destructive"
                            disabled={deletePage.isPending}
                            onClick={() => {
                              if (deleteTarget) {
                                deletePage.mutate(deleteTarget.id);
                              }
                            }}
                          >
                            {deletePage.isPending
                              ? "Deleting..."
                              : "Delete Permanently"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
