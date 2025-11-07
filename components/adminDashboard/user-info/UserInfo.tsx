
"use client";

import { useState, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  IBlockUserParams,
  IBlockUserResponse,
  IUser,
  IPlan, // Assuming IPlan is part of this import
} from "@/types/client/user-info";
import useAdminPresence from "@/hooks/useUserRealtime";
import Link from "next/link";

// --- API Functions ---

async function fetchUsers(
  filter: string,
  search: string,
  page: number,
  pageSize: number
): Promise<{ users: IUser[]; total: number }> {
  const { data } = await axios.get(`/api/admin/dashboard/getAllUsers`, {
    params: {
      filter,
      search,
      page,
      pageSize,
    },
  });
  return data;
}

async function blockUser(
  params: IBlockUserParams
): Promise<IBlockUserResponse> {
  const { data } = await axios.patch(`/api/admin/dashboard/blockUser`, params);
  return data;
}

// ADDED: Function to fetch available plans
async function fetchPlans(): Promise<IPlan[]> {
  const { data } = await axios.get(`/api/admin/plans`);
  return data;
}

// ADDED: Function to change a user's plan
async function changeUserPlan(params: { userId: string; newPlanId: string }) {
  const { data } = await axios.patch(
    `/api/admin/dashboard/changeUserPlan`,
    params
  );
  return data;
}

// --- Component ---

export default function UserInfoContent() {
  // --- State ---
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // State for Block User Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [reason, setReason] = useState("");

  // ADDED: State for Change Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // --- React Query ---
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", filter, searchTerm, page],
    queryFn: () => fetchUsers(filter, searchTerm, page, pageSize),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // ADDED: Query to get all available plans for the modal dropdown
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });
  const availablePlans = plansData || [];

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users", filter, searchTerm, page],
      });
      setShowModal(false);
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  // ADDED: Mutation for changing a user's plan
  const changePlanMutation = useMutation({
    mutationFn: changeUserPlan,
    onSuccess: () => {
      toast.success("User plan updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["users", filter, searchTerm, page],
      });
      setShowPlanModal(false); // Close the modal on success
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  // --- Handlers ---
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value.toLowerCase());
    setPage(1);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleBlockClick = (user: IUser) => {
    setSelectedUser(user);
    setReason("");
    setShowModal(true);
  };

  const handleBlockSubmit = () => {
    if (!reason.trim() || !selectedUser) return;
    blockMutation.mutate({ userId: selectedUser.id, reason });
  };

  // ADDED: Handlers for the Change Plan modal
  const handleEditPlanClick = (user: IUser) => {
    setSelectedUser(user);
    setSelectedPlanId(user.plan?.id || ""); // Set default to user's current plan
    setShowPlanModal(true);
  };

  const handlePlanChangeSubmit = () => {
    if (!selectedUser || !selectedPlanId) return;
    changePlanMutation.mutate({
      userId: selectedUser.id,
      newPlanId: selectedPlanId,
    });
  };

  // --- Data & Presence ---
  const users = data?.users || [];
  const total = data?.total || 0;
  // CORRECTED: Pagination calculation
  const totalPages = Math.ceil(total / pageSize);

  const onlineUsers = useAdminPresence(["users", filter, searchTerm, page]);
  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));

  // --- JSX ---
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>

      {/* Search and Filter */}
      <div className="flex mb-4 gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <select
          className="px-4 py-2 border rounded-lg"
          onChange={handleFilterChange}
          defaultValue="all"
        >
          <option value="all">All Users</option>
          <option value="blocked">Blocked</option>
          <option value="new">New</option>
        </select>
      </div>

      {isLoading && <p>Loading users...</p>}
      {isError && <p className="text-red-600">Error: {error?.message}</p>}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>JP Earned</TableHead>
              <TableHead>JP Balance</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full relative bg-purple-100 flex items-center justify-center">
                      {user.name.slice(0, 2).toUpperCase()}
                      {onlineUserIds.has(user?.id) && (
                        <span className="absolute h-2 w-2 bottom-0 right-0 rounded-full bg-green-500 ring-1 ring-white"></span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>{user.jpEarned}</TableCell>
                <TableCell>{user.jpBalance}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {user.plan?.name || "Free"}
                  </span>
                </TableCell>
                <TableCell>
                  {/* ADDED: Actions container */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleEditPlanClick(user)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit Plan
                    </button>
                    <button
                      className={`${
                        user.isBlocked
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-900"
                      } font-medium`}
                      onClick={() => handleBlockClick(user)}
                      disabled={user.isBlocked}
                    >
                      {user.isBlocked ? "Blocked" : "Block"}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-gray-500"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Block User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Block User</h3>
            <p className="mb-4">
              Blocking <strong>{selectedUser.email}</strong>
            </p>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="Enter reason for blocking"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                onClick={handleBlockSubmit}
                disabled={!reason.trim() || blockMutation.isPending}
              >
                {blockMutation.isPending ? "Blocking..." : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDED: Change Plan Modal */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Change Plan</h3>
            <p className="mb-4">
              Changing plan for <strong>{selectedUser.email}</strong>
            </p>
            <select
              className="w-full border rounded-lg p-2 mb-4"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              disabled={isLoadingPlans}
            >
              <option value="" disabled>
                {isLoadingPlans ? "Loading plans..." : "Select a new plan"}
              </option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setShowPlanModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handlePlanChangeSubmit}
                disabled={!selectedPlanId || changePlanMutation.isPending}
              >
                {changePlanMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}