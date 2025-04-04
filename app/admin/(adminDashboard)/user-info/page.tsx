"use client";

import { useState, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";

// Define TypeScript interfaces for Plan and User data
interface IPlan {
  name: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  jpEarned: number;
  jpBalance: number;
  createdAt: string;
  isBlocked: boolean;
  plan?: IPlan | null;
}

// Axios-based function to fetch users based on the provided filter and search term
async function fetchUsers(filter: string, search: string): Promise<IUser[]> {
  const { data } = await axios.get<IUser[]>(
    `/api/admin/dashboard/getAllUsers?filter=${filter}&search=${encodeURIComponent(
      search
    )}`
  );
  return data;
}

// Define parameters and response types for the block user API call
interface IBlockUserParams {
  userId: string;
  reason: string;
  blockedBy?: string;
}

interface IBlockUserResponse {
  message: string;
  user: IUser;
}

// Axios-based function to block a user
async function blockUser(
  params: IBlockUserParams
): Promise<IBlockUserResponse> {
  const { data } = await axios.patch<IBlockUserResponse>(
    `/api/admin/dashboard/blockUser`,
    params
  );
  return data;
}

export default function UserInfoContent() {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [reason, setReason] = useState<string>("");

  const queryClient = useQueryClient();

  // Use TanStack Query to fetch users using filter and search term in the query key
  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery<IUser[], Error>({
    queryKey: ["users", filter, searchTerm],
    queryFn: () => fetchUsers(filter, searchTerm),
    refetchOnWindowFocus: false,
  });

  // Mutation to block a user via Axios
  const blockMutation = useMutation({
    mutationFn: (params: IBlockUserParams) => blockUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users", filter, searchTerm],
      });
      setShowModal(false);
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err));
    },
  });

  // Handle filter change event
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value.toLowerCase());
  };

  // Handle search term change event
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Open the block modal and select a user
  const handleBlockClick = (user: IUser) => {
    setSelectedUser(user);
    setReason("");
    setShowModal(true);
  };

  // Submit the block action using the mutation
  const handleBlockSubmit = (): void => {
    if (!reason.trim() || !selectedUser) return;
    blockMutation.mutate({
      userId: selectedUser.id,
      reason,
      // Optionally include blockedBy information if needed
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      <div className="flex mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
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
      </div>

      {isLoading && <p>Loading users...</p>}
      {isError && <p className="text-red-600">Error: {error?.message}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                JP Earned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                JP Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.jpEarned}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.jpBalance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {user.plan ? user.plan.name : "Free"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className={`${
                      user.isBlocked
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:text-red-900"
                    }`}
                    onClick={() => handleBlockClick(user)}
                    disabled={user.isBlocked}
                  >
                    {user.isBlocked ? "Blocked" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-4 text-sm text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    </div>
  );
}
