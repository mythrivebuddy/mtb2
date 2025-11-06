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
import { useQuery, useMutation } from "@tanstack/react-query";
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

// ✅ Group Type
type AccountabilityGroup = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  createdBy: string;
  isBlocked?: boolean; // ✅ Added
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
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupStatus, setSelectedGroupStatus] = useState<
    "block" | "unblock" | null
  >(null);

  // ✅ Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Fetch Groups
  const { data, isLoading, refetch } = useQuery<GroupsApiResponse>({
    queryKey: ["accountabilityGroupsForAdmin", page, debouncedSearch],
    queryFn: async () => {
      const res = await axios.get(
        `/api/admin/accountabilty-hub-admin?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  // ✅ DELETE Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGroupId) return;
      return axios.delete(`/api/accountability-hub/groups/${selectedGroupId}`);
    },
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      const deletedName = getSelectedGroupName();
      toast.success(`${deletedName} has been deleted successfully.`);

      await refetch();
      setSelectedGroupId(null);
    },
  });

  // ✅ BLOCK / UNBLOCK Mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGroupId) return;
      return axios.patch(
        `/api/accountability-hub/groups/block-group?groupId=${selectedGroupId}`
      );
    },
    onSuccess: async (res) => {
      if (res?.data.success) {
        const groupName = res.data?.group?.name;
        const msg = res.data?.group?.isBlocked
          ? `${groupName} has been blocked successfully.`
          : `${groupName} has been unblocked successfully.`;

        toast.success(msg);
        await refetch();
        setBlockDialogOpen(false);
        setSelectedGroupId(null);
        setSelectedGroupStatus(null);
      }
    },
  });
  const getSelectedGroupName = () => {
    return groups.find((g) => g.id === selectedGroupId)?.name || "this group";
  };

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

      {/* ✅ Search */}
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
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Created By</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Created</TableHead>
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

            {groups.map((g) => (
              <TableRow
                key={g.id}
                className={g.isBlocked ? "bg-red-50 opacity-70 w-full" : ""}
              >
                {/* ✅ NAME + BADGE INSIDE SAME CELL */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{g.name}</span>

                    {g.isBlocked && (
                      <span className="mt-1 inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded w-fit">
                        🔒 Blocked by Admin
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">{g.createdBy}</TableCell>
                <TableCell className="text-center">{g.memberCount}</TableCell>
                <TableCell className="text-center">
                  {new Date(g.createdAt).toLocaleDateString("en-GB")}
                </TableCell>

                {/* ✅ ACTIONS */}
                <TableCell className={`text-center`}>
                  <div className="flex items-center gap-4 justify-center">
                    {/* ✅ VIEW */}
                    <Link
                      href={`/dashboard/accountability/?groupId=${g.id}`}
                      target="_blank"
                      className={
                        g.isBlocked
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-900"
                      }
                      onClick={(e) => g.isBlocked && e.preventDefault()}
                    >
                      View
                    </Link>

                    {/* ✅ EDIT */}

                    <button
                      disabled={g.isBlocked}
                      onClick={() =>
                        window.open(
                          `/dashboard/accountability-hub/create?groupId=${g.id}`,
                          "_blank"
                        )
                      }
                      className={
                        g.isBlocked
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-indigo-600 hover:text-indigo-900"
                      }
                    >
                      Edit
                    </button>

                    {/* ✅ DELETE (Always Red) */}
                    <button
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 font-semibold hover:text-red-800"
                    >
                      Delete
                    </button>

                    {/* ✅ BLOCK / UNBLOCK */}
                    <button
                      className={
                        g.isBlocked
                          ? "text-green-700 font-semibold hover:text-green-900" // ✅ Unblock — Green (clear meaning)
                          : "text-orange-600 font-semibold hover:text-orange-800" // ✅ Block — Orange
                      }
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setSelectedGroupStatus(
                          g.isBlocked ? "unblock" : "block"
                        );
                        setBlockDialogOpen(true);
                      }}
                    >
                      {g.isBlocked ? "Unblock" : "Block"}
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

      {/* ✅ DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Group</DialogTitle>
          </DialogHeader>

          <p>
            Are you sure you want to delete the group{" "}
            <strong>{getSelectedGroupName()}</strong>? This action cannot be
            undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
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
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ BLOCK / UNBLOCK DIALOG */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">
              {selectedGroupStatus === "block"
                ? "Block Group"
                : "Unblock Group"}
            </DialogTitle>
          </DialogHeader>

          <p>
            Are you sure you want to{" "}
            {selectedGroupStatus === "block" ? "block" : "unblock"}
            the group <strong>{getSelectedGroupName()}</strong> ?
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>

            <Button
              disabled={blockMutation.isPending}
              onClick={() => blockMutation.mutate()}
            >
              {blockMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Processing...
                </span>
              ) : selectedGroupStatus === "block" ? (
                "Confirm Block"
              ) : (
                "Confirm Unblock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
