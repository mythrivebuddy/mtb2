"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import AnnouncementDialog from "./AnnouncementDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AnnouncementType {
  id: string;
  title: string;
  backgroundColor: string;
  fontColor: string;
  linkUrl?: string | null;
  openInNewTab: boolean;
  isActive: boolean;
  audience: "EVERYONE" | "PAID" | "FREE";
  expireAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ✅ Helper: check expiry
const isExpired = (expireAt?: string | null) => {
  if (!expireAt) return false;
  return new Date(expireAt) < new Date();
};

// ✅ Helper: format date
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Announcement() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeButtonLoading, setActiveButtonLoading] = useState(false);

  const queryClient = useQueryClient();

  // ✅ Fetch announcements
  const { data, isLoading, isError } = useQuery<AnnouncementType[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/announcement");
      return res.data.announcements;
    },
  });

  // ✅ Delete announcement
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { data } = await axios.delete(`/api/admin/announcement/${deleteId}`);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["user-announcement"] });
      toast.success(data.message || "Announcement deleted successfully.");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete announcement.");
    } finally {
      setDeleteId(null);
    }
  };

  // ✅ Toggle active state
  const handleToggleActive = async (announcement: AnnouncementType) => {
    if (isExpired(announcement.expireAt)) return; // expired → cannot toggle
    setActiveButtonLoading(true);
    try {
      const { data } = await axios.patch(`/api/admin/announcement/${announcement.id}`, {
        isActive: !announcement.isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["user-announcement"] });
      toast.success(`Announcement turned ${data.announcement.isActive ? "On" : "Off"}`);
    } catch (err) {
      console.error("Toggle failed", err);
      toast.error("Failed to update announcement status.");
    } finally {
      setActiveButtonLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-lg min-h-screen">
      <div className="flex-1 overflow-auto">
        <h1 className="p-4 sm:p-8 text-xl sm:text-2xl font-semibold mb-4">
          Create Announcement
        </h1>

        <div className="flex justify-center sm:justify-end items-center px-2 sm:px-8 pb-4 mb-4">
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base bg-blue-700 hover:bg-blue-800"
          >
            Add Announcement
          </Button>
        </div>

        <div className="px-4 sm:px-8">
          <div className="w-full max-w-7xl mx-auto border rounded-md overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%] px-2">Title</TableHead>
                  <TableHead className="w-[12%] text-center">Background Color</TableHead>
                  <TableHead className="w-[10%] text-center">Font Color</TableHead>
                  <TableHead className="w-[10%] text-center">Active</TableHead>
                  <TableHead className="w-[14%] text-center">Audience</TableHead>
                  <TableHead className="w-[10%] text-center">Expire At</TableHead>
                  <TableHead className="text-center w-[15%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </TableRow>
                )}

                {isError && (
                  <TableRow>
                    <td colSpan={7} className="text-red-500 text-center py-4">
                      Failed to load announcements
                    </td>
                  </TableRow>
                )}

                {data && data.length > 0 ? (
                  data.map((announcement) => {
                    const expired = isExpired(announcement.expireAt);
                    return (
                      <TableRow
                        key={announcement.id}
                        className={expired ? "bg-red-50" : ""}
                      >
                        {/* Title */}
                        <td className="px-2 align-middle">{announcement.title}</td>

                        {/* Background Color */}
                        <td className="align-middle">
                          <div
                            className="h-6 w-10 rounded-sm mx-auto"
                            style={{ backgroundColor: announcement.backgroundColor }}
                            title={announcement.backgroundColor}
                          />
                        </td>

                        {/* Font Color */}
                        <td className="align-middle">
                          <div
                            className="h-6 w-10 rounded-sm mx-auto"
                            style={{ backgroundColor: announcement.fontColor }}
                            title={announcement.fontColor}
                          />
                        </td>

                        {/* Active / Expired */}
                        <td className="align-middle text-center">
                          {expired ? (
                            <span className="px-3 py-1 rounded-full bg-gray-500 text-white text-xs font-medium">
                              Expired
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(announcement)}
                              className={`px-3 py-1 rounded-full text-white text-xs font-medium transition-colors ${
                                announcement.isActive
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                              disabled={activeButtonLoading}
                            >
                              {announcement.isActive ? "On" : "Off"}
                            </button>
                          )}
                        </td>

                        {/* Audience */}
                        <td className="align-middle text-center">{announcement.audience}</td>

                        {/* Expire At */}
                        <td className="align-middle text-center">
                          {expired ? (
                            <span className="text-red-600 font-semibold">
                              {formatDate(announcement.expireAt)} (Expired)
                            </span>
                          ) : (
                            formatDate(announcement.expireAt)
                          )}
                        </td>

                        {/* Actions */}
                        <td className="flex justify-center gap-2 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(announcement);
                              setOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(announcement.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </TableRow>
                    );
                  })
                ) : (
                  !isLoading && (
                    <TableRow>
                      <td colSpan={7} className="text-gray-500 text-center py-4">
                        No announcements
                      </td>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog for Add/Edit */}
      <AnnouncementDialog open={open} setOpen={setOpen} announcement={editing} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(val) => !val && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete this announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 ease-linear"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
