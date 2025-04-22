"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Gift, Sparkles, Coins, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/tw";
import axios from "axios";


interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}
// const dummyNotifications = [
//   {
//     id: "1",
//     type: "JP_EARNED",
//     title: "JP Earned",
//     message: "You earned 100 JP for Daily Login",
//     isRead: false,
//     createdAt: new Date().toISOString(),
//     metadata: { amount: 100, activity: "Daily Login" },
//   },
//   {
//     id: "2",
//     type: "JP_EARNED",
//     title: "JP Earned",
//     message: "You earned 50 JP for Miracle Log",
//     isRead: true,
//     createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
//     metadata: { amount: 50, activity: "Miracle Log" },
//   },
//   {
//     id: "3",
//     type: "PROSPERITY_APPLIED",
//     title: "Prosperity Drop Applied",
//     message:
//       "Your prosperity drop application has been submitted and is under review",
//     isRead: false,
//     createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
//     metadata: {},
//   },
//   {
//     id: "4",
//     type: "SPOTLIGHT_APPROVED",
//     title: "Spotlight Approved",
//     message: "Your spotlight application has been approved",
//     isRead: false,
//     createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
//     metadata: {},
//   },
//   {
//     id: "5",
//     type: "SPOTLIGHT_ACTIVE",
//     title: "Spotlight Active",
//     message: "Your spotlight is now active and visible to other users",
//     isRead: true,
//     createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
//     metadata: {},
//   },
//   {
//     id: "6",
//     type: "MAGIC_BOX_SHARED",
//     title: "Magic Box Shared",
//     message: "You shared 150 JP with John Doe",
//     isRead: false,
//     createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
//     metadata: {
//       sharedWithUserId: "dummy-user-id",
//       sharedWithUserName: "John Doe",
//       amount: 150,
//     },
//   },
//   {
//     id: "7",
//     type: "MAGIC_BOX_SHARED",
//     title: "Magic Box Shared",
//     message: "You shared 75 JP with Jane Smith",
//     isRead: true,
//     createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
//     metadata: {
//       sharedWithUserId: "dummy-user-id-2",
//       sharedWithUserName: "Jane Smith",
//       amount: 75,
//     },
//   },
//   {
//     id: "8",
//     type: "JP_EARNED",
//     title: "JP Earned",
//     message: "You earned 200 JP for Progress Vault",
//     isRead: false,
//     createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
//     metadata: { amount: 200, activity: "Progress Vault" },
//   },
// ];

export default function NotificationsPage() {
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/notifications");
      return data as Notification[];
      // return dummyNotifications
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "JP_EARNED":
        return <Coins className="w-5 h-5 text-yellow-500" />;
      case "PROSPERITY_APPLIED":
      case "SPOTLIGHT_APPROVED":
      case "SPOTLIGHT_ACTIVE":
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      case "MAGIC_BOX_SHARED":
        return <Gift className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* <div className="mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
      </div> */}

      {notifications?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications yet
        </div>
      ) : (
        notifications?.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "bg-white p-4 rounded-lg shadow-sm border mb-3",
              !notification.isRead && "border-blue-500"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{notification.title}</h3>
                </div>
                <p className="text-gray-600 mt-1">{notification.message}</p>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {notification.isRead && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
