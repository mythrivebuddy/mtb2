// File: app/(userDashboard)/dashboard/reminders/page.tsx

"use client";

//import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PlusCircle, Edit, X, RotateCcw } from "lucide-react";

// --- Data Structure and Mock Data ---
interface Reminder {
  id: number;
  title: string;
  frequency: string;
  image: string;
  status: "Active" | "Inactive";
}

const initialReminders: Reminder[] = [
  {
    id: 1,
    title: "Water Reminder",
    frequency: "Every 90 mins",
    image: "https://i.pinimg.com/736x/37/7b/cc/377bcc74a4f8dadbaabe20e5039606ba.jpg",
    status: "Active",
  },
  {
    id: 2,
    title: "Posture Reminder",
    frequency: "Every 60 mins",
    image:"https://i.pinimg.com/736x/de/a6/9b/dea69bbae7f8a1b5dbc5e1e4da111834.jpg",
    status: "Active",
  },
  {
    id: 3,
    title: "Focus Reminder",
    frequency: "Every 120 mins",
    image: "https://i.pinimg.com/736x/0b/87/dc/0b87dc9e5bd86847568b0def579d29d1.jpg",
    status: "Active",
  },
];

// --- Edit Modal Component ---
const EditReminderModal = ({
  reminder,
  isOpen,
  onClose,
  onSave,
}: {
  reminder: Reminder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReminder: Reminder) => void;
}) => {
  const [title, setTitle] = useState(reminder?.title || "");
  const [frequency, setFrequency] = useState(reminder?.frequency || "");

  // This effect ensures the form resets when a new reminder is selected
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setFrequency(reminder.frequency);
    }
  }, [reminder]);

  if (!isOpen || !reminder) return null;

  const handleSave = () => {
    onSave({ ...reminder, title, frequency });
    onClose();
  };

  const handleReset = () => {
    setTitle(reminder.title);
    setFrequency(reminder.frequency);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl m-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Reminder
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <input
              id="frequency"
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end items-center space-x-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-transparent rounded-lg hover:bg-gray-200"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Reminder Card Component main ---
const ReminderCard = ({ reminder, onEditClick }: { reminder: Reminder, onEditClick: (reminder: Reminder) => void }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md transition-transform hover:scale-105">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-green-600">{reminder.status}</span>
        <h3 className="text-xl font-bold text-gray-800">{reminder.title}</h3>
        <p className="text-gray-500 mb-3">{reminder.frequency}</p>
        <button
          onClick={() => onEditClick(reminder)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg w-fit"
        >
          <Edit size={14} />
          Edit
        </button>
      </div>
      <img
        src={reminder.image}
        alt={reminder.title}
        className="w-24 h-24 rounded-lg object-cover"
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/ffffff?text=Error'; }}
      />
    </div>
  );
};

// --- Main Page Component ---
export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);

  const handleOpenEditModal = (reminder: Reminder) => {
    setCurrentReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setCurrentReminder(null);
    setIsEditModalOpen(false);
  };

  const handleSaveChanges = (updatedReminder: Reminder) => {
    setReminders(reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r));
    // Here you would also make an API call to save the changes to the database
  };

  // Main page component
  return (
    <>
      <EditReminderModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        reminder={currentReminder}
        onSave={handleSaveChanges}
      />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <button className="p-2  text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110">
              <PlusCircle size={24} />
            </button>
        <div className="max-w-2xl mx-auto">
           
          <header className="relative flex pl-24 justify-center items-center  gap-4 mb-8">
           
            <h1 className="text-3xl pr-16  font-bold text-gray-800">
              Reminders
            </h1>
          </header>

          <p className="text-center text-gray-600  mb-10 text-lg">
            Set up gentle reminders to stay aligned, hydrated, and focused.
          </p>

          <div className="space-y-6">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} onEditClick={handleOpenEditModal} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
