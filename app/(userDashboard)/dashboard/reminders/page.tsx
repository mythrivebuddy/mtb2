// File: app/(userDashboard)/dashboard/reminders/page.tsx

"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Edit, X, Sun, Moon, Check, Bell } from "lucide-react";

// --- Configuration & Data ---

// Defines the structure for a reminder object
interface Reminder {
  id: number;
  title: string;
  description: string;
  frequency: string;
  image: string;
  status: "Active" | "Inactive";
  startTime?: string;
  endTime?: string;
}

// A list of high-quality default images for new reminders.
const defaultImages = [
  "https://i.pinimg.com/736x/ad/62/10/ad62101d828fc8043e7683c847c431ba.jpg", // Water
  "https://i.pinimg.com/736x/2e/35/11/2e351118f6c52d6c1fff588c40de1b24.jpg", // Posture
  "https://i.pinimg.com/736x/de/1d/c6/de1dc6a1b9e98aaee4fdaebb831d5e2e.jpg", // Focus
  "https://i.pinimg.com/736x/81/7a/f6/817af681ea7217517c588f6a902b9a69.jpg", // General
];

// Initial mock data for demonstration
const initialReminders: Reminder[] = [
  {
    id: 1,
    title: "Water Reminder",
    description: "Hydration fuels your focus. Take a sip now!",
    frequency: "Every 90 mins",
    image: "https://i.pinimg.com/736x/37/7b/cc/377bcc74a4f8dadbaabe20e5039606ba.jpg",
    status: "Active",
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    id: 2,
    title: "Posture Reminder",
    description: "Sit up straight! Your future self will thank you.",
    frequency: "Every 60 mins",
    image: "https://i.pinimg.com/736x/de/a6/9b/dea69bbae7f8a1b5dbc5e1e4da111834.jpg",
    status: "Active",
  },
  {
    id: 3,
    title: "Focus Reminder",
    description: "Time to take a short break and stretch.",
    frequency: "Every 120 mins",
    image: "https://i.pinimg.com/736x/0b/87/dc/0b87dc9e5bd86847568b0def579d29d1.jpg",
    status: "Active",
  },
];

// --- Reusable Reminder Form Component ---
const ReminderForm = ({
    initialData = {},
    onSave,
    onClose,
    isEditMode = false
}: {
    initialData?: Partial<Reminder>;
    onSave: (data: Omit<Reminder, 'id' | 'status'>) => void;
    onClose: () => void;
    isEditMode?: boolean;
}) => {
    const [title, setTitle] = useState(initialData.title || "");
    const [description, setDescription] = useState(initialData.description || "");
    const [freqValue, setFreqValue] = useState(60);
    const [freqUnit, setFreqUnit] = useState<'mins' | 'hours'>("mins");
    const [startTime, setStartTime] = useState(initialData.startTime || "");
    const [endTime, setEndTime] = useState(initialData.endTime || "");
    // State to manage the selected image for the reminder
    const [selectedImage, setSelectedImage] = useState(initialData.image || defaultImages[0]);

    // Effect to parse and set frequency when editing an existing reminder
    useEffect(() => {
        if (initialData.frequency) {
            const parts = initialData.frequency.replace('Every', '').trim().split(' ');
            if (parts.length === 2) {
                setFreqValue(parseInt(parts[0], 10));
                setFreqUnit(parts[1] as 'mins' | 'hours');
            }
        }
    }, [initialData]);

    // Handles the save action, validates input, and calls the onSave prop
    const handleSave = () => {
        if (!title || !freqValue) {
            console.error("Please fill in the reminder name and frequency.");
            return;
        }
        onSave({
            title,
            description,
            frequency: `Every ${freqValue} ${freqUnit}`,
            startTime,
            endTime,
            image: selectedImage,
        });
        onClose();
    };

    return (
        <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl m-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? "Edit Reminder" : "Add New Reminder"}</h2>
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Reminder Name</label>
                    <input id="title" type="text" placeholder="e.g. Water Reminder" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="description" placeholder="e.g. Hydration fuels your focus..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
                </div>
                {/* --- New Image Selector Section --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose an Image</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {defaultImages.map(imgSrc => (
                            <div key={imgSrc} onClick={() => setSelectedImage(imgSrc)} className={`relative rounded-lg overflow-hidden cursor-pointer aspect-square transition-all duration-200 ${selectedImage === imgSrc ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-300'}`}>
                                <img src={imgSrc} alt="Reminder image option" className="w-full h-full object-cover" />
                                {selectedImage === imgSrc && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <Check className="text-white" size={32} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-600">Every</span>
                        <input type="number" value={freqValue} onChange={(e) => setFreqValue(parseInt(e.target.value, 10))} className="w-24 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <select value={freqUnit} onChange={(e) => setFreqUnit(e.target.value as "mins" | "hours")} className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="mins">mins</option>
                            <option value="hours">hours</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Range (Optional)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="relative">
                            <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={handleSave} className="px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Save Reminder
                </button>
            </div>
        </div>
    );
};

// --- View Reminder Modal ---
const ViewReminderModal = ({ reminder, isOpen, onClose, onSnooze, onDone }: { reminder: Reminder | null; isOpen: boolean; onClose: () => void; onSnooze: (id: number) => void; onDone: (id: number) => void; }) => {
    if (!isOpen || !reminder) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-2xl text-center">
                <img src={reminder.image} alt={reminder.title} className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow-lg" />
                <h2 className="text-3xl font-bold text-indigo-900 mb-2">{reminder.title}</h2>
                <p className="text-gray-600 mb-8">{reminder.description}</p>
                <div className="space-y-3">
                    <button onClick={() => onDone(reminder.id)} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-xl shadow-md hover:bg-green-600 transition-transform hover:scale-105"><Check size={22} /> Done</button>
                    <button onClick={() => onSnooze(reminder.id)} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-xl shadow-md hover:bg-gray-300 transition-transform hover:scale-105"><Bell size={20} /> Snooze for 15 mins</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
        </div>
    );
};

// --- Reminder Card Component ---
const ReminderCard = ({ reminder, onEditClick, onViewClick }: { reminder: Reminder; onEditClick: (reminder: Reminder) => void; onViewClick: (reminder: Reminder) => void; }) => {
  return (
    <div onClick={() => onViewClick(reminder)} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-green-600">{reminder.status}</span>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{reminder.title}</h3>
        <p className="text-sm sm:text-base text-gray-500 mb-3">{reminder.frequency}</p>
        <button onClick={(e) => { e.stopPropagation(); onEditClick(reminder); }} className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg w-fit"><Edit size={14} /> Edit</button>
      </div>
      <img src={reminder.image} alt={reminder.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0 ml-4" onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/ffffff?text=Error'; }} />
    </div>
  );
};

// --- Main Page Component ---
export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);

  // Opens the correct modal ('edit' or 'view')
  const handleOpenModal = (reminder: Reminder, type: 'edit' | 'view') => {
    setCurrentReminder(reminder);
    if (type === 'edit') setIsEditModalOpen(true);
    if (type === 'view') setIsViewModalOpen(true);
  };

  // Closes all modals
  const handleCloseModals = () => {
    setCurrentReminder(null);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsAddModalOpen(false);
  };

  // Saves changes from the edit form
  const handleSaveChanges = (updatedData: Omit<Reminder, 'id' | 'status'>) => {
    if (currentReminder) {
        setReminders(reminders.map(r => r.id === currentReminder.id ? { ...currentReminder, ...updatedData } : r));
    }
  };

  // Adds a new reminder to the list
  const handleAddNewReminder = (newReminderData: Omit<Reminder, 'id' | 'status'>) => {
    const newReminder: Reminder = {
        id: Date.now(),
        status: 'Active',
        ...newReminderData,
    };
    setReminders(prev => [newReminder, ...prev]);
  };

  // Placeholder functions for snooze and done actions
  const handleSnooze = (id: number) => { console.log(`Snoozing reminder ${id} for 15 minutes.`); handleCloseModals(); };
  const handleDone = (id: number) => { console.log(`Reminder ${id} marked as done.`); handleCloseModals(); };

  return (
    <>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <ReminderForm onSave={handleAddNewReminder} onClose={handleCloseModals} />
        </div>
      )}
      {isEditModalOpen && currentReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <ReminderForm isEditMode={true} initialData={currentReminder} onSave={handleSaveChanges} onClose={handleCloseModals} />
        </div>
      )}
      <ViewReminderModal isOpen={isViewModalOpen} onClose={handleCloseModals} reminder={currentReminder} onSnooze={handleSnooze} onDone={handleDone} />
      
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header: Centered on desktop, stacked on mobile */}
          <header className="relative flex flex-col sm:justify-center items-center gap-4 mb-8 py-2">
              {/* Add Button: Positioned on the left for desktop, full width on mobile */}
              <div className="w-full sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:w-auto">
                  <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105"
                  >
                      <PlusCircle size={20} />
                      <span className="sm:hidden">Add New Reminder</span>
                  </button>
              </div>
              {/* Title: Always centered */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center order-first sm:order-none">
                  Reminders
              </h1>
          </header>
          {/* Paragraph: Always centered */}
          <p className="text-center text-gray-600 mb-10 text-base sm:text-lg">
              Set up gentle reminders to stay aligned, hydrated, and focused.
          </p>
          <div className="space-y-6">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} onEditClick={(r) => handleOpenModal(r, 'edit')} onViewClick={(r) => handleOpenModal(r, 'view')} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
