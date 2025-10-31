//challenge/page.tsx

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  CalendarDays,
  Gift,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ChallengeDetailsForClient } from "@/types/client/challengeDetail";
import { cn } from "@/lib/utils/tw";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import CreateChallenge from "./create-challenge/page";
import { useClickAway } from "react-use";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion,AnimatePresence } from "framer-motion";

// --- Types ---
type Challenge = ChallengeDetailsForClient & {
  isHosted?: boolean;
  id: string;
  creatorName: string;
  enrollments?: { userId: string }[];
  _count?: { enrollments: number };
  dailyTasks?: Task[]; // Add tasks to the challenge type
};

type Task = {
  id: string;
  description: string;
  completed?: boolean;
};

type EditFormData = {
  title: string;
  description: string;
  tasks: Partial<Task>[]; // Tasks can have an optional ID for new ones
};

type FilterStatus = Challenge["status"] | "ALL" | "HOSTED" | "JOINED";

// --- Helper Functions ---
const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const getStartDateInfo = (startDate: string): string | null => {
  const now = new Date();
  const start = new Date(startDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (start < now) return null;
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Starting Today";
  if (diffDays === 1) return "Starts in 1 day";
  return `Starts in ${diffDays} days`;
};

// --- Main Page Component ---
export default function ChallengePage() {
  const router = useRouter();
  const { status: authStatus, data: session } = useSession();
  const queryClient = useQueryClient();

  // --- State Management ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challengeToEdit, setChallengeToEdit] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ title: "", description: "", tasks: [] });

  // --- Refs ---
  const searchRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickAway(searchRef, () => setSearchVisible(false));

  // --- Local Storage and Filters ---
  const category1: FilterStatus[] = ["ALL", "JOINED", "HOSTED"];
  const category2: FilterStatus[] = ["ACTIVE", "UPCOMING", "COMPLETED"];
  const [selectedFilters, setSelectedFilters] = useState<FilterStatus[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("challengeFilters");
      if (saved) try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ["ALL", "UPCOMING"];
  });

  useEffect(() => {
    localStorage.setItem("challengeFilters", JSON.stringify(selectedFilters));
  }, [selectedFilters]);

  // --- Data Fetching (React Query) ---
  const { data: challenges, isLoading: isLoadingChallenges } = useQuery<Challenge[]>({
    queryKey: ["getAllChallenges"],
    queryFn: async () => (await axios.get("/api/challenge/get-all")).data,
  });

  // Fetch details (including tasks) for the specific challenge being edited
  const { data: challengeDetails, isLoading: isLoadingDetails } = useQuery<Challenge>({
    queryKey: ["getChallengeDetails", challengeToEdit?.id],
    queryFn: async () => (await axios.get(`/api/challenge/my-challenge/${challengeToEdit!.id}`)).data,
    enabled: !!challengeToEdit, // Only run this query when a challenge is selected for editing
  });

  // --- Data Mutations ---
  const deleteChallengeMutation = useMutation({
    mutationFn: (challengeId: string) => axios.delete(`/api/challenge/my-challenge/${challengeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllChallenges"] });
      setChallengeToDelete(null);
    },
    onError: (error: AxiosError) => console.error("Delete failed:", error),
  });

  const editChallengeMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & EditFormData) => axios.patch(`/api/challenge/my-challenge/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["getChallengeDetails", challengeToEdit?.id] });
      setChallengeToEdit(null);
    },
    onError: (error: AxiosError) => console.error("Edit failed:", error),
  });

  // --- Effects ---
  useEffect(() => {
    if (searchVisible) inputRef.current?.focus();
  }, [searchVisible]);

  useEffect(() => {
    if (challengeDetails) {
      setEditFormData({
        title: challengeDetails.title,
        description: challengeDetails.description || "",
        tasks: challengeDetails.dailyTasks || [],
      });
    }
  }, [challengeDetails]);

  // --- Event Handlers ---
  const handleFilterClick = (filter: FilterStatus) => {
    setSelectedFilters((prev) => {
      if (category1.includes(filter)) return [filter, prev.find(f => category2.includes(f)) || category2[0]];
      if (category2.includes(filter)) return [prev.find(f => category1.includes(f)) || category1[0], filter];
      return prev;
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTaskChange = (index: number, value: string) => {
    const updatedTasks = [...editFormData.tasks];
    updatedTasks[index].description = value;
    setEditFormData(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleAddTask = () => {
    if (editFormData.tasks.length >= 3) return;
    setEditFormData(prev => ({ ...prev, tasks: [...prev.tasks, { description: "" }] }));
  };

  const handleDeleteTask = (index: number) => {
    setEditFormData(prev => ({ ...prev, tasks: prev.tasks.filter((_, i) => i !== index) }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (challengeToEdit) {
      editChallengeMutation.mutate({ id: challengeToEdit.id, ...editFormData });
    }
  };

  // --- Data Filtering ---
  const filtered = useMemo(() => {
    if (!challenges) return [];
    return challenges.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
      const category1Match = selectedFilters.includes("ALL") || (selectedFilters.includes("HOSTED") && c.creator?.id === session?.user?.id) || (selectedFilters.includes("JOINED") && c.enrollments?.some(e => e.userId === session?.user?.id));
      const category2Match = selectedFilters.includes(c.status);
      return matchesSearch && category1Match && category2Match;
    }).sort((a, b) => selectedFilters.includes("COMPLETED") ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : 0);
  }, [challenges, searchTerm, selectedFilters, session?.user?.id]);

  // --- Render Logic ---
  const pageContent = (
    <>
      <div className="min-h-screen w-full p-4 mt-4 sm:p-6 lg:p-8">
        {/* Header and Filters */}
        <div className="flex justify-between items-center w-full mb-4">
          <div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button onClick={() => authStatus === "unauthenticated" ? signIn() : setIsModalOpen(true)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition">
                  <PlusCircle size={28} />
                  <span className="font-semibold hidden sm:inline">Create</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <CreateChallenge onSuccess={() => setIsModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-indigo-900">Challenges</h1>
          </div>
          <div>
      <div className="relative max-sm:mt-8 max-sm:mb-8" ref={searchRef}>
  {/* Search icon button */}
  <button
    onClick={() => setSearchVisible((p) => !p)}
    className="p-1 rounded-full hover:bg-gray-100 transition"
    aria-label="Toggle search"
  >
    <Search size={24} className="text-gray-600" />
  </button>

  {/* Animated dropdown search field */}
  <AnimatePresence>
    {searchVisible && (
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className="absolute right-0 mt-2 z-20 w-72 bg-white border rounded-lg shadow-lg p-2 flex items-center gap-2 mb-12"
      >
        <Search size={16} className="text-gray-400" />
        <input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setSearchVisible(false)}
          placeholder="Search challenges..."
          className="flex-1 text-sm bg-transparent focus:outline-none "
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-gray-400 hover:text-gray-600 text-lg px-1"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</div>

          </div>
        </div>
        <p className="text-center text-lg text-slate-600 max-w-2xl mx-auto mb-10">Your personal challenges and new ones to discover, all in one place.</p>
        <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
          {category1.concat(category2).map((filter) => (
            <button key={filter} onClick={() => handleFilterClick(filter)} className={cn("px-5 py-2 text-sm font-semibold rounded-full transition", selectedFilters.includes(filter) ? (category1.includes(filter) ? "bg-blue-800 text-white shadow-md" : "bg-pink-700 text-white shadow-md") : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100")}>
              {filter === "JOINED" ? "Joined" : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {isLoadingChallenges ? (
          <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500">No challenges found for the selected filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => {
              const isJoined = c.enrollments?.some(e => e.userId === session?.user?.id);
              const isHosted = c.creator?.id === session?.user?.id;
              return (
                <div key={c.id} onClick={() => router.push(isJoined ? `/dashboard/challenge/my-challenges/${c.id}` : `/dashboard/challenge/upcoming-challenges/${c.id}`)} className="relative overflow-hidden bg-white rounded-xl shadow hover:shadow-lg p-6 border cursor-pointer flex flex-col transition hover:-translate-y-1">
                  {isJoined && <div className="absolute top-4 -right-9 transform rotate-45 bg-indigo-500 text-center text-white text-sm font-semibold py-1 w-32">Joined</div>}
                  <div className="mb-2 pt-4"><h3 className="text-xl font-bold text-indigo-800 truncate">{c.title}</h3></div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{c.description || "No desc."}</p>
                  <span className="inline-block w-fit bg-gradient-to-r from-indigo-50 to-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-purple-100 mb-4">Created By: {c.creatorName}</span>
                  {getStartDateInfo(c.startDate) && <div className="mb-4"><span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">{getStartDateInfo(c.startDate)}</span></div>}
                  <div className={`flex items-center gap-2 mb-2 ${!getStartDateInfo(c.startDate) && "mt-10"}`}>
                    <CalendarDays className="w-4 h-4" /><span className="text-sm">{formatDate(c.startDate)}</span><span className="text-slate-300">→</span><span className="text-sm">{formatDate(c.endDate)}</span>
                  </div>
                  {/* --- CARD FOOTER --- */}
                  <div className="flex justify-between items-center mt-auto pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Users className="w-4 h-4" /><span>{c._count?.enrollments ?? 0} Joined</span></div>
                    {isHosted ? (
                      <div className="flex items-center gap-3"> {/* Container for both reward and icons */}
                        <div className="flex items-center gap-1 text-purple-700 font-bold text-sm">
                          <Gift className="w-4 h-4" />
                          <span>{c.reward} JP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* --- THIS IS THE CLEANED SECTION --- */}
                          <button onClick={e => { e.stopPropagation(); setChallengeToEdit(c); }} className="p-2 rounded-full hover:bg-gray-100 transition" aria-label="Edit challenge"><Pencil className="w-4 h-4 text-gray-700" /></button>
                          <button onClick={e => { e.stopPropagation(); setChallengeToDelete(c); }} className="p-2 rounded-full hover:bg-red-100 transition" aria-label="Delete challenge"><Trash2 className="w-4 h-4 text-red-600" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-purple-700 font-bold">
                        <Gift className="w-4 h-4" />
                        <span>{c.reward} JP</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-12 text-center text-lg font-bold text-indigo-900 drop-shadow-md md:text-2xl">Ready to Kick Off? Let’s Dive In!!</p>
      </div>

      {/* --- Edit Challenge Dialog --- */}
      <Dialog open={!!challengeToEdit} onOpenChange={() => setChallengeToEdit(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit: {challengeToEdit?.title}</DialogTitle>
            <DialogDescription>Update the challenge details and tasks.</DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <form onSubmit={handleEditSubmit} className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" value={editFormData.title} onChange={handleEditFormChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" value={editFormData.description} onChange={handleEditFormChange} className="col-span-3" />
              </div>
              {/* Task Editing Section */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Tasks</Label>
                <div className="col-span-3 space-y-2">
                  {editFormData.tasks.map((task, index) => (
                    <div key={task.id || `new-${index}`} className="flex items-center gap-2">
                      <Input value={task.description} onChange={e => handleTaskChange(index, e.target.value)} placeholder={`Task #${index + 1}`} required />
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteTask(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTask} disabled={editFormData.tasks.length >= 3}>Add Task</Button>
                  {editFormData.tasks.length >= 3 && (
                    <p className="text-xs text-red-500 pt-1">Maximum of 3 tasks reached.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editChallengeMutation.isPending}>
                  {editChallengeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog open={!!challengeToDelete} onOpenChange={() => setChallengeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              <span>
                This will permanently delete the challenge{' '}
                <strong>{challengeToDelete?.title}</strong>. This action cannot be
                undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setChallengeToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => challengeToDelete && deleteChallengeMutation.mutate(challengeToDelete.id)} disabled={deleteChallengeMutation.isPending}>
              {deleteChallengeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return authStatus === "authenticated" ? pageContent : <AppLayout>{pageContent}</AppLayout>;
}