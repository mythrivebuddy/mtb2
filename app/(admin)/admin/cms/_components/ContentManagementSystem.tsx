"use client";

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

export default function CMSPageList() {
  const queryClient = useQueryClient();

  const pagesQuery = useQuery({
    queryKey: ["cms-pages"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/cms");
      return res.data;
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/admin/cms/${id}`);
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] }),
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
              pagesQuery.data.map((p:any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell className="font-mono text-sm">
                    /{p.slug}
                  </TableCell>
                  <TableCell>
                    {p.isPublished ? (
                      <Badge className="bg-green-600">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(p.updatedAt || p.createdAt).toLocaleString()}
                  </TableCell>
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

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this page?")) {
                          deletePage.mutate(p.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
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
