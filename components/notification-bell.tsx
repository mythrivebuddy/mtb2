'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  message: string;
  link?: string;
  type: string; // e.g., 'APPROVED_REQUEST', 'CANCELLATION'
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchNotifications = async () => {
        try {
          const response = await axios.get('/api/buddy-lens/notifications', {
            params: { unreadOnly: true },
          });
          setNotifications(response.data);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.link) {
        router.push(notification.link);
      }
      await axios.patch('/api/buddy-lens/notifications', {
        notificationId: notification.id,
      });
      setNotifications(notifications.filter((n) => n.id !== notification.id));
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No new notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { Bell } from 'lucide-react';
// import { useSession } from 'next-auth/react';
// import axios from 'axios';
// import { useRouter } from 'next/navigation';

// interface Notification {
//   id: string;
//   message: string;
//   link?: string;
//   type: string; // e.g., 'APPROVED_REQUEST', 'CANCELLATION'
//   read: boolean;
//   createdAt: string;
// }

// export function NotificationBell() {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const { data: session } = useSession();
//   const router = useRouter();
//   const notificationRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (session?.user?.id) {
//       const fetchNotifications = async () => {
//         try {
//           const response = await axios.get('/api/buddy-lens/notifications', {
//             params: { unreadOnly: true },
//           });
//           setNotifications(response.data);
//         } catch (err) {
//           console.error('Failed to fetch notifications:', err);
//         }
//       };

//       fetchNotifications();
//       const interval = setInterval(fetchNotifications, 30000);
//       return () => clearInterval(interval);
//     }
//   }, [session?.user?.id]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         notificationRef.current &&
//         !notificationRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleNotificationClick = async (notification: Notification) => {
//     try {
//       if (notification.link) {
//         router.push(notification.link);
//       }
//       await axios.patch('/api/buddy-lens/notifications', {
//         notificationId: notification.id,
//       });
//       setNotifications(notifications.filter((n) => n.id !== notification.id));
//       setIsOpen(false);
//     } catch (err) {
//       console.error('Failed to mark notification as read:', err);
//     }
//   };

//   return (
//     <div className="relative" ref={notificationRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="p-2 rounded-full hover:bg-gray-100 relative"
//       >
//         <Bell className="w-6 h-6" />
//         {notifications.length > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//             {notifications.length}
//           </span>
//         )}
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ">
//           <div className="p-4">
//             <h3 className="font-semibold mb-2">Notifications</h3>
//             {notifications.length === 0 ? (
//               <p className="text-gray-500">No new notifications</p>
//             ) : (
//               <div className="space-y-2">
//                 {notifications.map((notification) => (
//                   <div
//                     key={notification.id}
//                     onClick={() => handleNotificationClick(notification)}
//                     className="p-2 hover:bg-gray-100 rounded cursor-pointer"
//                   >
//                     <p className="text-sm">{notification.message}</p>
//                     <p className="text-xs text-gray-500">
//                       {new Date(notification.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }