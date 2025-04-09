"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Prisma, ProsperityDropStatus } from "@prisma/client";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { Badge } from "@/components/ui/badge";

export default function ProsperityPage() {
  const queryClient = useQueryClient();

  // Fetch all prosperity applications
  const { data: applications, isLoading } = useQuery<
    Prisma.ProsperityDropGetPayload<{ include: { user: true } }>[]
  >({
    queryKey: ["prosperityApplications"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/prosperity");
      return response.data;
    },
  });

  // Mutation for updating application status
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ProsperityDropStatus;
    }) => {
      const response = await axios.put(`/api/admin/prosperity/${id}`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prosperityApplications"] });
      toast.success("Status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Something went wrong");
    },
  });

  if (isLoading) return <PageLoader />;

  const getStatusBadgeColor = (status: ProsperityDropStatus) => {
    const colors = {
      APPLIED: "bg-yellow-500",
      IN_REVIEW: "bg-blue-500",
      APPROVED: "bg-green-500",
      DISAPPROVED: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-10 px-0 ">
      <h1 className="text-2xl font-bold mb-6">Prosperity Drop Applications</h1>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.title}</TableCell>
                <TableCell>{app.description}</TableCell>
                <TableCell>{app.user.name}</TableCell>
                <TableCell>
                  {format(new Date(app.appliedAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(app.status)}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {app.status === "APPLIED" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({
                          id: app.id,
                          status: "IN_REVIEW",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Review
                    </Button>
                  )}
                  {app.status === "IN_REVIEW" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          updateStatus.mutate({
                            id: app.id,
                            status: "APPROVED",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updateStatus.mutate({
                            id: app.id,
                            status: "DISAPPROVED",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
