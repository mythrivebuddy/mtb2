"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotlightStatus } from "@prisma/client";
import { format } from "date-fns";
import { getAxiosErrorMessage } from "@/utils/ax";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

interface SpotlightApplication {
  id: string;
  user: {
    name: string;
    email: string;
    id: string;
  };
  status: SpotlightStatus;
  appliedAt: string;
}

const fetchSpotlightApplications = async (
  currentPage: number,
  limit: number
) => {
  const { data } = await axios.get("/api/admin/spotlight/application", {
    params: {
      page: currentPage,
      limit,
    },
  });
  return data;
};

const updateSpotlightStatus = async (id: string) => {
  const response = await axios.put(`/api/admin/spotlight/${id}`, {
    status: "IN_REVIEW",
  });
  return response.data;
};

const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  return names
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const getStatusBadgeVariant = (
  status: SpotlightStatus
): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "APPROVED":
      return "secondary";
    case "DISAPPROVED":
      return "destructive";
    case "IN_REVIEW":
      return "outline";
    case "ACTIVE":
      return "default";
    case "EXPIRED":
      return "default";
    default:
      return "outline";
  }
};

export default function SpotlightApplication() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const router = useRouter();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["spotlightApplications"],
    queryFn: () => fetchSpotlightApplications(currentPage, limit),
  });
  const totalPages = Math.ceil((applications?.totalApplications || 0) / limit);

  const mutation = useMutation({
    mutationFn: updateSpotlightStatus,
    onSuccess: (_, id) => {
      router.push(`/admin/spotlight/${id}`);
      toast.success("Status updated to IN_REVIEW");
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error, "Failed to update status"));
      console.error(error);
    },
  });

  const handleReview = (
    spotlightId: string,
    currentStatus: SpotlightStatus
  ) => {
    if (currentStatus === "APPLIED") {
      mutation.mutate(spotlightId);
    } else {
      router.push(`/admin/spotlightapplication/${spotlightId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currentSpotlight = applications?.spotlightApplications?.find(
    (app: SpotlightApplication) => app.status === "ACTIVE"
  );
  console.log(currentSpotlight);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">
        Spotlight Application Management
      </h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Current Spotlight</h3>
        {currentSpotlight ? (
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
            <div className="flex items-start">
              <div className="mr-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-pink-100 flex items-center justify-center text-lg font-bold">
                  {getInitials(currentSpotlight.user.name)}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold">
                  {currentSpotlight.user.name}
                </h4>
                <p className="text-gray-600">
                  User Email: {currentSpotlight.user.email}
                </p>
                <p className="mt-2 text-gray-700">
                  Application Date:
                  {format(new Date(currentSpotlight.appliedAt), "MMM d, yyyy")}
                </p>
                <div className="mt-4">
                  <Button variant="destructive">Remove Spotlight</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active spotlight user found.</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Spotlight Applications</h3>
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </TableHead>

              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application Date
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View Profile
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200">
            {applications?.spotlightApplications?.map(
              (app: SpotlightApplication) => (
                <TableRow key={app.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                        {getInitials(app.user.name)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">
                          {app.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(app.appliedAt), "MMM d, yyyy hh:mm a")}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="outline"
                      onClick={() => console.log("hello")}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="default"
                      onClick={() => handleReview(app.id, app.status)}
                      disabled={
                        mutation.isPending && mutation.variables === app.id
                      }
                    >
                      View Application
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
