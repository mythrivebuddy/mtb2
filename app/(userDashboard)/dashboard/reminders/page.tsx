// File: app/(userDashboard)/dashboard/reminders/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { PlusCircle, Edit, X, Sun, Moon, Check, Bell, Trash2, Loader2 } from "lucide-react";

// --- Configuration & Data ---
interface Reminder {
  id: string;
  title: string;
  description: string | null;
  frequency: number;
  image: string;
  isActive: boolean; // Corresponds to the DB `isActive` field
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  lastNotifiedAt?: string | null; 
}

const defaultImages = [
  "https://i.pinimg.com/736x/37/7b/cc/377bcc74a4f8dadbaabe20e5039606ba.jpg", 
  "https://i.pinimg.com/736x/de/a6/9b/dea69bbae7f8a1b5dbc5e1e4da111834.jpg", 
  "https://i.pinimg.com/736x/0b/87/dc/0b87dc9e5bd86847568b0def579d29d1.jpg", 
  "https://i.pinimg.com/736x/11/80/77/1180778cd46b771c00d92317637e3680.jpg", 
];

const reminderTemplates = [
    { title: "Water", description: "Hydration fuels your focus. Take a sip now!", image: defaultImages[0] },
    { title: "Posture", description: "Sit up straight! Your future self will thank you.", image: defaultImages[1] },
    { title: "Focus", description: "Time to take a short break and stretch.", image: defaultImages[2] }
];

// --- API Interaction Functions ---
const fetchReminders = async (): Promise<Reminder[]> => {
    // --- FIX: Removed the incorrect mapping that hardcoded the status ---
    const { data } = await axios.get("/api/user/reminders");
    return data;
};
const addReminder = async (newReminder: Omit<Reminder, 'id' | 'isActive' | 'createdAt' | 'lastNotifiedAt'>): Promise<Reminder> => {
    const { data } = await axios.post("/api/user/reminders", newReminder);
    return data;
};
const updateReminder = async (updatedReminder: Partial<Reminder> & { id: string }): Promise<Reminder> => {
    const { data } = await axios.put("/api/user/reminders", updatedReminder);
    return data;
};
const deleteReminder = async (id: string): Promise<{ message: string }> => {
    const { data } = await axios.delete(`/api/user/reminders?id=${id}`);
    return data;
};
const snoozeReminder = async (id: string): Promise<Reminder> => {
    const { data } = await axios.patch("/api/user/reminders/snooze", { id });
    return data;
};

// --- Reusable Reminder Form Component ---
const ReminderForm = ({ initialData = {}, onSave, onClose, isEditMode = false, onDelete, isSaving = false, isDeleting = false }: { initialData?: Partial<Reminder>; onSave: (data: Omit<Reminder, 'id' | 'isActive' | 'createdAt' | 'lastNotifiedAt'>) => void; onClose: () => void; isEditMode?: boolean; onDelete?: (id: string) => void; isSaving?: boolean; isDeleting?: boolean; }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [frequency, setFrequency] = useState(30);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedImage, setSelectedImage] = useState(defaultImages[0]);

    // --- FIX: Correctly pre-fill state when the edit modal opens ---
    useEffect(() => {
        if (isEditMode && initialData) {
            setTitle(initialData.title || "");
            setDescription(initialData.description || "");
            setFrequency(initialData.frequency || 30);
            setStartTime(initialData.startTime || "");
            setEndTime(initialData.endTime || "");
            setSelectedImage(initialData.image || defaultImages[0]);
        }
    }, [initialData, isEditMode]);

    const handleSave = () => {
        if (!title) { toast.error("Please fill in the reminder name."); return; }
        onSave({ title, description: description || null, frequency, startTime: startTime || null, endTime: endTime || null, image: selectedImage });
    };

    const applyTemplate = (template: typeof reminderTemplates[0]) => {
        setTitle(template.title + " Reminder");
        setDescription(template.description);
        setSelectedImage(template.image);
    };

    return (
        <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl m-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? "Edit Reminder" : "Add New Reminder"}</h2>
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                {!isEditMode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start with a template</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {reminderTemplates.map(template => (
                                <button key={template.title} onClick={() => applyTemplate(template)} className="flex-1 text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                    <p className="font-semibold text-gray-800">{template.title}</p>
                                    <p className="text-xs text-gray-500">{template.description.substring(0, 25)}...</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Reminder Name</label>
                    <input id="title" type="text" placeholder="e.g. Water Reminder" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="description" placeholder="e.g. Hydration fuels your focus..." value={description || ''} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose an Image</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {defaultImages.map(imgSrc => (
                            <div key={imgSrc} onClick={() => setSelectedImage(imgSrc)} className={`relative rounded-lg overflow-hidden cursor-pointer aspect-square transition-all duration-200 ${selectedImage === imgSrc ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-300'}`}>
                                <img src={imgSrc} alt="Reminder image option" className="w-full h-full object-cover" />
                                {selectedImage === imgSrc && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Check className="text-white" size={32} /></div>)}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every 60 minutes</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Range (Optional)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="time" value={startTime || ''} onChange={(e) => setStartTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="relative">
                            <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="time" value={endTime || ''} onChange={(e) => setEndTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
                {isEditMode && onDelete && (<button onClick={() => onDelete(initialData.id!)} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400">{isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}</button>)}
                <div className="flex-grow flex justify-end">
                    {/* --- FIX: Added loading state to the Save button --- */}
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                        {isSaving && <Loader2 className="animate-spin" size={20} />}
                        Save Reminder
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- View Reminder Modal ---
const ViewReminderModal = ({ reminder, isOpen, onClose, onSnooze, onDone, isSnoozing }: { reminder: Reminder | null; isOpen: boolean; onClose: () => void; onSnooze: (id: string) => void; onDone: (id: string) => void; isSnoozing?: boolean; }) => {
    if (!isOpen || !reminder) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-2xl text-center">
                <img src={reminder.image} alt={reminder.title} className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow-lg" />
                <h2 className="text-3xl font-bold text-indigo-900 mb-2">{reminder.title}</h2>
                <p className="text-gray-600 mb-8">{reminder.description}</p>
                <div className="space-y-3">
                    <button onClick={() => onDone(reminder.id)} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-xl shadow-md hover:bg-green-600 transition-transform hover:scale-105"><Check size={22} /> Done</button>
                    <button onClick={() => onSnooze(reminder.id)} disabled={isSnoozing} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-xl shadow-md hover:bg-gray-300 transition-transform hover:scale-105 disabled:bg-gray-300">
                        {isSnoozing ? <Loader2 className="animate-spin" size={20} /> : <Bell size={20} />}
                        {isSnoozing ? 'Snoozing...' : 'Snooze for 15 mins'}
                    </button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
        </div>
    );
};

// --- Reminder Card Component ---
const ReminderCard = ({ reminder, onEditClick, onViewClick }: { reminder: Reminder; onEditClick: (reminder: Reminder) => void; onViewClick: (reminder: Reminder) => void; }) => {
    // --- FIX: Logic to calculate if a reminder is currently snoozed from DB data ---
    const isSnoozed = reminder.lastNotifiedAt && (new Date(reminder.lastNotifiedAt).getTime() + (15 * 60 * 1000) > Date.now());
    
    const formatFrequency = (freq: number) => {
        if (freq === 60) return 'Every 60 minutes';
        if (freq === 30) return 'Every 30 minutes';
        return `Every ${freq} mins`;
    };
  
    return (
        <div onClick={() => onViewClick(reminder)} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer">
            <div className="flex flex-col">
                {isSnoozed ? (
                    <span className="text-sm font-semibold text-yellow-600">Snoozed</span>
                ) : (
                    <span className="text-sm font-semibold text-green-600">{reminder.isActive ? "Active" : "Inactive"}</span>
                )}
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{reminder.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-3">{formatFrequency(reminder.frequency)}</p>
                <button onClick={(e) => { e.stopPropagation(); onEditClick(reminder); }} className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg w-fit"><Edit size={14} /> Edit</button>
            </div>
            <img src={reminder.image} alt={reminder.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0 ml-4" onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/ffffff?text=Error'; }} />
        </div>
    );
};

// --- Main Page Component ---
export default function RemindersPage() {
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);

    const { data: reminders = [], isLoading, isError } = useQuery<Reminder[]>({
        queryKey: ['reminders'],
        queryFn: fetchReminders,
    });

    const addMutation = useMutation({ mutationFn: addReminder, onSuccess: () => { toast.success("Reminder added!"); queryClient.invalidateQueries({ queryKey: ['reminders'] }); handleCloseModals(); }, onError: () => { toast.error("Failed to add reminder."); } });
    const updateMutation = useMutation({ mutationFn: updateReminder, onSuccess: () => { toast.success("Reminder updated!"); queryClient.invalidateQueries({ queryKey: ['reminders'] }); handleCloseModals(); }, onError: () => { toast.error("Failed to update reminder."); } });
    const deleteMutation = useMutation({ mutationFn: deleteReminder, onSuccess: () => { toast.success("Reminder deleted!"); queryClient.invalidateQueries({ queryKey: ['reminders'] }); handleCloseModals(); }, onError: () => { toast.error("Failed to delete reminder."); } });
    
    // --- FIX: Snooze now refetches data to show persistent state ---
    const snoozeMutation = useMutation({
        mutationFn: snoozeReminder,
        onSuccess: () => {
            toast.success("Reminder snoozed!");
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            handleCloseModals();
        },
        onError: () => { toast.error("Failed to snooze reminder."); }
    });

    const handleOpenModal = (reminder: Reminder, type: 'edit' | 'view') => { setCurrentReminder(reminder); if (type === 'edit') setIsEditModalOpen(true); if (type === 'view') setIsViewModalOpen(true); };
    const handleCloseModals = () => { setCurrentReminder(null); setIsEditModalOpen(false); setIsViewModalOpen(false); setIsAddModalOpen(false); };
    const handleDone = (id: string) => { console.log(`Reminder ${id} marked as done.`); handleCloseModals(); };
    const handleSnooze = (id: string) => { snoozeMutation.mutate(id); };

    return (
        <>
            {isAddModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"><ReminderForm onSave={(data) => addMutation.mutate(data)} onClose={handleCloseModals} isSaving={addMutation.isPending} /></div>)}
            {isEditModalOpen && currentReminder && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"><ReminderForm isEditMode={true} initialData={currentReminder} onSave={(data) => updateMutation.mutate({ ...data, id: currentReminder.id })} onDelete={(id) => deleteMutation.mutate(id)} isSaving={updateMutation.isPending} isDeleting={deleteMutation.isPending} onClose={handleCloseModals} /></div>)}
            <ViewReminderModal isOpen={isViewModalOpen} onClose={handleCloseModals} reminder={currentReminder} onSnooze={handleSnooze} onDone={handleDone} isSnoozing={snoozeMutation.isPending} />
            
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <header className="relative flex flex-col sm:justify-center items-center gap-4 mb-8 py-2">
                        <div className="w-full sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:w-auto">
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
                                <PlusCircle size={20} /><span className="sm:hidden">Add New Reminder</span>
                            </button>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center order-first sm:order-none">Reminders</h1>
                    </header>
                    <p className="text-center text-gray-600 mb-10 text-base sm:text-lg">Set up gentle reminders to stay aligned, hydrated, and focused.</p>
                    
                    {isLoading && <div className="text-center text-gray-500">Loading reminders...</div>}
                    {isError && <div className="text-center text-red-500">Failed to load reminders.</div>}

                    <div className="space-y-6">
                        {!isLoading && !isError && reminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} onEditClick={(r) => handleOpenModal(r, 'edit')} onViewClick={(r) => handleOpenModal(r, 'view')} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

