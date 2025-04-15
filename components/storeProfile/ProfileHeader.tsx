"use client";

import React, { useState } from "react";
import { UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  mobile: string;
  country: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  membership: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";
  membershipEndDate?: string;
  addresses?: Address[];
}

interface MembershipOption {
  type: "MONTHLY" | "YEARLY" | "LIFETIME";
  price: number;
  duration: string;
}

interface ProfileHeaderProps {
  user: User | null;
}

const membershipOptions: MembershipOption[] = [
  { type: "MONTHLY", price: 29, duration: "30 days" },
  { type: "YEARLY", price: 299, duration: "365 days" },
  { type: "LIFETIME", price: 2999, duration: "Lifetime" },
];

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipOption | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    id: "",
    street: "",
    city: "",
    state: "",
    pin: "",
    mobile: "",
    country: "",
  });

  const queryClient = useQueryClient();

  const membershipMutation = useMutation({
    mutationFn: async (membershipType: string) => {
      const response = await axios.post(
        "/api/store/user/membership",
        { membershipType },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Membership updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      setIsMembershipModalOpen(false);
      setSelectedMembership(null);
    },
    onError: (error) => {
      console.error("Membership update error:", error);
      toast.error("Failed to update membership.");
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (address: { id?: string; street: string; city: string; state: string; pin: string; mobile: string; country: string }) => {
      const response = await axios.put("/api/store/user/address", {
        id: address.id, // Include id if present
        street: address.street,
        city: address.city,
        state: address.state,
        pin: address.pin,
        mobile: address.mobile,
        country: address.country,
      }, { withCredentials: true }); // Ensure session cookie is sent
      return response.data;
    },
    onSuccess: () => {
      toast.success("Address updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      setIsAddressModalOpen(false);
    },
    onError: (error) => {
      console.error("Address update error:", error);
      toast.error("Failed to update address.");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await axios.delete("/api/store/user/address", {
        data: { addressId },
        withCredentials: true, // Ensure session cookie is sent
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Address deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
    onError: (error) => {
      console.error("Address delete error:", error);
      toast.error("Failed to delete address.");
    },
  });

  const handleMembershipChange = () => {
    if (!selectedMembership) {
      toast.error("Please select a membership plan!");
      return;
    }
    membershipMutation.mutate(selectedMembership.type);
  };

  const openAddAddressModal = () => {
    setAddressForm({
      id: "",
      street: "",
      city: "",
      state: "",
      pin: "",
      mobile: "",
      country: "",
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: Address) => {
    setAddressForm({
      id: address.id,
      street: address.street,
      city: address.city,
      state: address.state,
      pin: address.pin,
      mobile: address.mobile,
      country: address.country,
    });
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.pin || !addressForm.mobile || !addressForm.country) {
      toast.error("Please fill in all address fields.");
      return;
    }
    updateAddressMutation.mutate(addressForm);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isMembershipActive = user?.membership && user.membership !== "FREE" && user.membershipEndDate;
  const currentMembership =
    user?.membership === "FREE"
      ? { type: "FREE", price: 0, duration: "N/A" }
      : membershipOptions.find((option) => option.type === user?.membership);
  const currentAddress = user?.addresses?.[0];

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <UserCircle2 className="w-20 h-20 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{user?.name || user?.username || "Guest"}</h1>
            <p className="text-gray-600">{user?.email || "No email"}</p>
            <p className="text-lg font-semibold text-indigo-600">
              Plan: {user?.membership || "Free"}
            </p>
            {isMembershipActive && (
              <p className="text-sm text-gray-500">Expires: {formatDate(user?.membershipEndDate)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {user?.membership !== "LIFETIME" && (
            <button
              onClick={() => setIsMembershipModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
            >
              {user?.membership === "FREE" ? "Choose Membership" : "Upgrade Membership"}
            </button>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Shipping Address</h2>
        {currentAddress ? (
          <div>
            <p>{currentAddress.street}</p>
            <p>
              {currentAddress.city}, {currentAddress.state} {currentAddress.pin}
            </p>
            <p>{currentAddress.mobile}</p>
            <p>{currentAddress.country}</p>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => openEditAddressModal(currentAddress)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
              >
                Edit Address
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your address?")) {
                    deleteAddressMutation.mutate(currentAddress.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
              >
                Delete Address
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">No address added</p>
            <button
              onClick={openAddAddressModal}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 mt-2 cursor-pointer"
            >
              Add Address
            </button>
          </div>
        )}
      </div>

      {/* Membership Modal */}
      {isMembershipModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">
              {user?.membership === "FREE" ? "Select a Membership" : "Upgrade Your Membership"}
            </h2>
            <div className="space-y-4">
              {currentMembership && (
                <div className="p-4 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                  <h3 className="text-lg font-semibold">{currentMembership.type} (Current Plan)</h3>
                  <p className="text-gray-600">Price: ${currentMembership.price}</p>
                  <p className="text-gray-600">Duration: {currentMembership.duration}</p>
                </div>
              )}
              {membershipOptions
                .filter(
                  (option) =>
                    user?.membership === "FREE" ||
                    (option.type !== user?.membership &&
                      ["MONTHLY", "YEARLY", "LIFETIME"].indexOf(option.type) >
                        ["MONTHLY", "YEARLY", "LIFETIME"].indexOf(user?.membership!))
                )
                .map((option) => (
                  <div
                    key={option.type}
                    className={`p-4 border rounded-lg cursor-pointer transition duration-200 ${
                      selectedMembership?.type === option.type
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMembership(option)}
                  >
                    <h3 className="text-lg font-semibold">{option.type}</h3>
                    <p className="text-gray-600">Price: ${option.price}</p>
                    <p className="text-gray-600">Duration: {option.duration}</p>
                  </div>
                ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleMembershipChange}
                disabled={membershipMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50 transition duration-200 cursor-pointer"
              >
                {membershipMutation.isPending ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => setIsMembershipModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">
              {addressForm.id ? "Edit Address" : "Add Address"}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Pin"
                value={addressForm.pin}
                onChange={(e) => setAddressForm({ ...addressForm, pin: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={addressForm.mobile}
                onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Country"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddressSubmit}
                disabled={updateAddressMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50 transition duration-200 cursor-pointer"
              >
                {updateAddressMutation.isPending ? "Saving..." : "Save Address"}
              </button>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;