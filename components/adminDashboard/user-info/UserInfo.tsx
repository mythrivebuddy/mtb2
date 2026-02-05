"use client";

import { useState } from "react";
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
import { FiCopy, FiCheck } from "react-icons/fi";

// --- API Functions ---

async function fetchUsers(
  filter: string,
  search: string,
  page: number,
  pageSize: number,
  userType: string,
  planType: string,
  programType: string
): Promise<{ users: IUserWithMembership[]; total: number }> {
  const { data } = await axios.get(`/api/admin/dashboard/getAllUsers`, {
    params: {
      filter,
      search,
      page,
      pageSize,
      userType,
      planType,
      programType,
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

// --- Types & Interfaces ---
export type IUserWithMembership = IUser & {
  membership: string;
};


// --- Component ---

export default function UserInfoContent() {
  // --- State ---
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ADDED: Filter states
  const [userType, setUserType] = useState("all");
  const [planType, setPlanType] = useState("all");
  const [programType, setProgramType] = useState("all");

  // State for Block User Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserWithMembership | null>(null);
  const [reason, setReason] = useState("");

  // ADDED: State for Change Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // ADDED: State for copied email
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // --- React Query ---
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "users",
      filter,
      searchTerm,
      page,
      pageSize,
      userType,
      planType,
      programType,
    ],
    queryFn: () =>
      fetchUsers(
        filter,
        searchTerm,
        page,
        pageSize,
        userType,
        planType,
        programType
      ),
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

  const handleBlockClick = (user: IUserWithMembership) => {
    setSelectedUser(user);
    setReason("");
    setShowModal(true);
  };

  const handleBlockSubmit = () => {
    if (!reason.trim() || !selectedUser) return;
    blockMutation.mutate({ userId: selectedUser.id, reason });
  };

  // ADDED: Handlers for the Change Plan modal
  const handleEditPlanClick = (user: IUserWithMembership) => {
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
  console.log({ onlineUsers });

  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));
  const filteredUsers =
    filter === "online"
      ? users.filter((u) => onlineUserIds.has(u.id))
      : users;
  console.log(filteredUsers);

  // handler for copy email functionality
  const handleCopy = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);

    setTimeout(() => setCopiedEmail(null), 1500);
  };


  // --- JSX ---
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
        {/* Search – full width always */}
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="col-span-2 sm:flex-1 px-4 py-2 border rounded-lg"
        />

        {/* EXISTING filter (kept) */}
        <select
          className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value.toLowerCase());
            setPage(1);
          }}
        >
          <option value="all">All Users</option>
          <option value="blocked">Blocked</option>
          <option value="new">New</option>
          <option value="online">Online</option>
        </select>

        {/* User Type */}
        <select
          className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Types</option>
          <option value="enthusiast">SGE</option>
          <option value="coach">Coach</option>
          <option value="solopreneur">Solopreneur</option>
        </select>

        {/* Plan Type */}
        <select
          className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          value={planType}
          onChange={(e) => {
            setPlanType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        {/* Program Type */}
        <select
          className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          value={programType}
          onChange={(e) => {
            setProgramType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Programs</option>
          <option value="any">Any Program</option>
          <option value="2026-complete-makeover">CMP</option>
          <option value="none">None</option>
        </select>

        {/* Page Size */}
        <select
          className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>

      </div>

      {isLoading && <p>Loading users...</p>}
      {isError && <p className="text-red-600">Error: {error?.message}</p>}

      {/* Users Table */}
      <div className={`overflow-x-auto ${(isLoading || filteredUsers.length === 0) && 'min-h-64'}`}>
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
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${user.id}`} target="_blank">
                      {
                        user.image ? (
                          <div className="rounded-full h-10 w-10">
                            <img src={user.image} alt={user.name} className="h-full  w-full rounded-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full relative bg-purple-100 flex items-center justify-center">
                            {user.name.slice(0, 2).toUpperCase()}
                            {onlineUserIds.has(user?.id) && (
                              <span className="absolute h-2 w-2 bottom-0 right-0 rounded-full bg-green-500 ring-1 ring-white"></span>
                            )}
                          </div>
                        )
                      }
                    </Link>
                    <div>
                      <Link href={`/profile/${user.id}`} target="_blank">
                        <div className="text-sm font-medium hover:underline">
                          {user.name}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{user.email}</span>

                        <button
                          type="button"
                          onClick={() => handleCopy(user.email)}
                          className="hover:text-primary transition"
                          title="Copy email"
                        >
                          {copiedEmail === user.email ? (
                            <FiCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>


                  </div>
                </TableCell>
                <TableCell>{user.jpEarned}</TableCell>
                <TableCell>{user.jpBalance}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${user.membership === 'FREE' ? 'bg-red-100' : 'bg-green-100'} text-green-800`}>
                    {user.membership}
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
                      className={`${user.isBlocked
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
            {filteredUsers.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-24 text-sm text-gray-500"
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