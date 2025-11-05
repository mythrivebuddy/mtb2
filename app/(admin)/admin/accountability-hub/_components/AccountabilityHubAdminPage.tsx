"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// ✅ ShadCN Dialog + Button
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AccountabilityGroup = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  createdBy: string;
};

interface GroupsApiResponse {
  groups: AccountabilityGroup[];
  totalCount: number;
  totalPages: number;
  page: number;
  success: boolean;
}

export default function AccountabilityHubAdminPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // ✅ Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Fetch groups
  const { data, isLoading,refetch } = useQuery<GroupsApiResponse>({
    queryKey: ["accountabilityGroupsForAdmin", page, debouncedSearch],
    queryFn: async () => {
      const res = await axios.get(
        `/api/admin/accountabilty-hub-admin?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`
      );
      return res.data as GroupsApiResponse;
    },
    placeholderData: (prev) => prev,
  });

  // ✅ Hard Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGroupId) return;
      return axios.delete(
        `/api/accountability-hub/groups/${selectedGroupId}`
      );
    },
    onSuccess: async() => {
      setDeleteDialogOpen(false);
      toast.success("Group deleted successfully!");
      await refetch()
      setSelectedGroupId(null);
    },
  });

  const groups = data?.groups ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading && !data) {
    return (
      <div className="p-6 text-center text-lg">
        Loading Accountability Groups...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Accountability Groups</h2>

      {/* ✅ Search + Filter */}
      <div className="flex flex-col sm:flex-row mb-4 gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search groups..."
          className="w-full px-4 py-2 border rounded-lg"
        />

        <select className="px-4 py-2 border rounded-lg">
          <option value="all">All Groups</option>
          <option value="blocked">Blocked</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* ✅ Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">Name</TableHead>
              <TableHead className="text-center">Created By</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Date Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {groups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-gray-500 text-lg"
                >
                  No groups found
                </TableCell>
              </TableRow>
            )}

            {groups.length > 0 &&
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell className="text-center">{g.createdBy}</TableCell>
                  <TableCell className="text-center">{g.memberCount}</TableCell>
                  <TableCell className="text-center">
                    {new Date(g.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-4 justify-center">
                      <Link
                        href={`/dashboard/accountability/?groupId=${g.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>

                      <button className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>

                      {/* ✅ DELETE BUTTON (opens dialog) */}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </button>

                      <button className="text-orange-600 hover:text-orange-900">
                        Block
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* ✅ ShadCN Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Group</DialogTitle>
          </DialogHeader>

          <p className="mb-4">
            Are you sure you want to delete this group? This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Deleting...
                </span>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
