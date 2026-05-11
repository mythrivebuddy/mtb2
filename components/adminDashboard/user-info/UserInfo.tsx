"use client";

import { useEffect, useState } from "react";
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
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import SortIndicator from "@/components/common/SortIndicator";

// --- API Functions ---

async function fetchUsers(
  filter: string,
  search: string,
  page: number,
  pageSize: number,
  userType: string,
  planType: string,
  programType: string,
  referrerId?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<{
  users: IUserWithMembership[];
  total: number;
  referrer?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
}> {
  const { data } = await axios.get(`/api/admin/dashboard/getAllUsers`, {
    params: {
      filter,
      search,
      page,
      pageSize,
      userType,
      planType,
      programType,
      referrerId,
      sortBy,
      sortOrder,
    },
  });
  return data;
}

async function blockUser(
  params: IBlockUserParams,
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
    params,
  );
  return data;
}

// --- Types & Interfaces ---
export type IUserWithMembership = IUser & {
  membership: string;
  _count?: {
    referrals: number;
  };
};
type AffiliateForm = {
  commissionType: "MTB" | "SUBSCRIPTION";
  affiliatePercent: number;
};
type UsersQueryData = {
  users: IUserWithMembership[];
  total: number;
  referrer?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
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
  const [selectedUser, setSelectedUser] = useState<IUserWithMembership | null>(
    null,
  );
  const [reason, setReason] = useState("");

  // ADDED: State for Change Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // ADDED: State for copied email
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // --- React Query ---
  const queryClient = useQueryClient();

  const deboncedSearch = useDebounce(searchTerm, 500);
  const searchParams = useSearchParams();
  const referrerId = searchParams.get("referrerId") || "";

  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [affiliateUser, setAffiliateUser] =
    useState<IUserWithMembership | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const form = useForm<AffiliateForm>({
    defaultValues: {
      commissionType: "MTB",
      affiliatePercent: undefined as unknown as number,
    },
  });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "users",
      filter,
      deboncedSearch,
      page,
      pageSize,
      userType,
      planType,
      programType,
      referrerId,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchUsers(
        filter,
        deboncedSearch,
        page,
        pageSize,
        userType,
        planType,
        programType,
        referrerId,
        sortBy,
        sortOrder,
      ),
    staleTime: 1000 * 60 * 5, //  5 minutes cache
    placeholderData: (prev) => prev,
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

  const makeAffiliateMutation = useMutation({
    mutationFn: async ({
      userId,
      percent,
      type,
    }: {
      userId: string;
      percent: number;
      type: "MTB" | "SUBSCRIPTION";
    }) => {
      const { data } = await axios.patch("/api/admin/affiliate/make", {
        userId,
        affiliatePercent: percent,
        commissionType: type,
      });
      return data;
    },
    onSuccess: (res, variables) => {
      toast.success("Affiliate updated successfully");
      setShowAffiliateModal(false);

      queryClient.setQueryData(
        [
          "users",
          filter,
          deboncedSearch,
          page,
          pageSize,
          userType,
          planType,
          programType,
          referrerId,
          sortBy,
          sortOrder,
        ],
        (oldData: UsersQueryData | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            users: oldData.users.map((u: IUserWithMembership) =>
              u.id === variables.userId
                ? {
                    ...u,
                    isAffiliate: true,
                    affiliatePercent: variables.percent,
                    affiliateCommissionType: variables.type,
                  }
                : u,
            ),
          };
        },
      );
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  // ADDED: Mutation for changing a user's plan
  const changePlanMutation = useMutation({
    mutationFn: changeUserPlan,
    onSuccess: () => {
      toast.success("User plan updated successfully!");

      setShowAffiliateModal(false);

      form.reset({
        commissionType: "MTB",
        affiliatePercent: undefined as unknown as number,
      });
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
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1); // reset pagination
  };
  // --- Data & Presence ---
  const users = data?.users || [];
  const total = data?.total || 0;
  // CORRECTED: Pagination calculation
  const totalPages = Math.ceil(total / pageSize);
  const referrerUser = data?.referrer;
  const onlineUsers = useAdminPresence(["users", filter, searchTerm, page]);

  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));
  const filteredUsers =
    filter === "online" ? users.filter((u) => onlineUserIds.has(u.id)) : users;

  // handler for copy email functionality
  const handleCopy = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);

    setTimeout(() => setCopiedEmail(null), 1500);
  };
  useEffect(() => {
    const email = searchParams.get("email");
    if (email) setSearchTerm(email);
  }, [searchParams]);
  // --- JSX ---
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      {referrerUser && (
        <Link
          href={`/profile/${referrerUser.id}`}
          target="_blank"
          className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg"
        >
          {referrerUser?.image ? (
            <img
              src={referrerUser.image || "/default-avatar.png"}
              alt={referrerUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full relative bg-purple-100 flex items-center justify-center">
              {referrerUser?.name?.slice(0, 2)?.toUpperCase()}
            </div>
          )}

          <div className="text-sm">
            <p className="font-medium text-blue-900">
              Referrals of {referrerUser.name}
            </p>
            <p className="text-blue-700 text-xs">{referrerUser.email}</p>
          </div>
        </Link>
      )}
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
          <option value="affiliate">Affiliate Users</option>
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

      {isLoading && <p className="text-center">Loading users...</p>}
      {isError && <p className="text-red-600">Error: {error?.message}</p>}

      {/* Users Table */}
      <div
        className={`overflow-x-auto ${(isLoading || filteredUsers.length === 0) && "min-h-64"}`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer group"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  User
                  <SortIndicator
                    field="name"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group"
                onClick={() => handleSort("jpEarned")}
              >
                <div className="flex items-center justify-center gap-1">
                  GP Earned
                  <SortIndicator
                    field="jpEarned"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group"
                onClick={() => handleSort("jpBalance")}
              >
                <div className="flex items-center justify-center gap-1">
                  GP Balance
                  <SortIndicator
                    field="jpBalance"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group"
                onClick={() => handleSort("referrals")}
              >
                <div className="flex items-center justify-center gap-1">
                  Total Referrals
                  <SortIndicator
                    field="referrals"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead className="text-center">Plan</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${user.id}`} target="_blank">
                      {user.image ? (
                        <div className="rounded-full h-10 w-10">
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-full  w-full rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full relative bg-purple-100 flex items-center justify-center">
                          {user.name.slice(0, 2).toUpperCase()}
                          {onlineUserIds.has(user?.id) && (
                            <span className="absolute h-2 w-2 bottom-0 right-0 rounded-full bg-green-500 ring-1 ring-white"></span>
                          )}
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link href={`/profile/${user.id}`} target="_blank">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium hover:underline">
                            {user.name}
                          </span>

                          {user.isAffiliate && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">
                              AFFILIATE
                            </span>
                          )}
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
                <TableCell className="text-center">{user.jpEarned}</TableCell>
                <TableCell className="text-center">{user.jpBalance}</TableCell>
                <TableCell className="text-center">
                  {/* <span className="font-semibold"> */}
                  {/* {user._count?.referrals || 0} */}
                  <Link
                    href={`/admin/user-info?referrerId=${user.id}`}
                    target="_blank"
                    className="hover:text-blue-600 hover:underline font-semibold"
                  >
                    {user._count?.referrals ?? 0}
                  </Link>
                  {/* </span> */}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${user.membership === "FREE" ? "bg-red-100" : "bg-green-100"} text-green-800`}
                  >
                    {user.membership}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {/* ADDED: Actions container */}
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={() => handleEditPlanClick(user)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit Plan
                    </button>
                    <button
                      onClick={() => {
                        setAffiliateUser(user);

                        form.reset({
                          commissionType:
                            user?.affiliateCommissionType || "MTB",
                          affiliatePercent: user?.affiliatePercent ?? undefined,
                        });

                        setShowAffiliateModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      {user.isAffiliate ? "Edit Affiliate" : "Make Affiliate"}
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
            {filteredUsers.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {Math.min((page - 1) * pageSize + filteredUsers.length, total)}
          </span>{" "}
          of <span className="font-semibold text-gray-700">{total}</span> users
        </p>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

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

      {/* ADDED: Affiliate Modal */}
      {showAffiliateModal && affiliateUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">
              {affiliateUser.isAffiliate ? "Edit Affiliate" : "Make Affiliate"}
            </h3>

            <form
              onSubmit={form.handleSubmit((values) => {
                if (!affiliateUser) return;

                makeAffiliateMutation.mutate({
                  userId: affiliateUser.id,
                  percent: values.affiliatePercent,
                  type: values.commissionType,
                });
              })}
              className="space-y-4"
            >
              {/* Commission Type */}
              <div>
                <p className="text-sm font-medium mb-2">Commission Type</p>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="MTB"
                      checked={form.watch("commissionType") === "MTB"}
                      onChange={() => form.setValue("commissionType", "MTB")}
                    />
                    Entire revenue on MTB products
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="SUBSCRIPTION"
                      checked={form.watch("commissionType") === "SUBSCRIPTION"}
                      onChange={() =>
                        form.setValue("commissionType", "SUBSCRIPTION")
                      }
                    />
                    Membership subscription fee
                  </label>
                </div>
              </div>

              {/* Percentage */}
              <div>
                <p className="text-sm font-medium mb-1">
                  Commission Percentage
                </p>
                <input
                  type="number"
                  placeholder="Enter % of commission"
                  {...form.register("affiliatePercent", {
                    valueAsNumber: true,
                    required: true,
                    min: 1,
                    max: 100,
                  })}
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      e.target.value = "";
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />

                {form.formState.errors.affiliatePercent && (
                  <p className="text-xs text-red-500 mt-1">
                    Enter value between 1–100
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => setShowAffiliateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg ${makeAffiliateMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={makeAffiliateMutation.isPending}
                >
                  {makeAffiliateMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
