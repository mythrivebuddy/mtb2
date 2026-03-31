"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import SignaturePad from "react-signature-canvas";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Award,
    PenLine,
    Upload,
    Search,
    CheckCircle2,
    XCircle,
    Shield,
    Layers,
    MoreHorizontal,
    Loader2,
    User,
    Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
    subsets: ["latin"],
    weight: "400",
});

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type FilterType = "all" | "eligible" | "not_eligible" | "issued";
type SignatureType = "DRAWN" | "IMAGE" | "TEXT";

interface Signature {
    id: string;
    userId: string;
    type: SignatureType;
    text: string | null;
    imageUrl: string | null;
    createdAt: string;
}

interface SignatureResponse {
    signature: Signature;
}
interface ParticipantsProgressResponse {
    participantId: string;
    name: string;
    email: string;
    avatar: string | null;
    programId: string;
    programTitle: string;
    joinedAt: string;
    lastActiveDate: string;
    completedDays: number;
    totalDays: number;
    completionPercentage: number;
    isCertificateIssued: boolean;
    programType: "CHALLENGE" | "MMP";
    certificateUrl?: string | null;
}
interface Participant {
    id: string;
    name: string;
    email: string;
    completionPercentage: number;
    joinedDate: string;
    lastActiveDate: string;
    isCertificateIssued: boolean;
    programTitle: string;
    programId: string;
    certificateUrl?: string | null;
}

interface ProgramRow {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    participants: Participant[];
}


// ─────────────────────────────────────────────
//  STATIC DATA
// ─────────────────────────────────────────────

const STATIC_MMP: ProgramRow[] = [
    {
        id: "mmp-1",
        title: "Public Speaking Mastery",
        startDate: "2025-01-15",
        endDate: "2025-03-15",
        participants: [
            { id: "m1", name: "Ishaan Chopra", email: "ishaan@example.com", completionPercentage: 90, joinedDate: "2025-01-15", lastActiveDate: "2025-03-14", isCertificateIssued: true, programTitle: "Public Speaking Mastery", programId: "mmp-1" },
            { id: "m2", name: "Pooja Bhatt", email: "pooja@example.com", completionPercentage: 55, joinedDate: "2025-01-16", lastActiveDate: "2025-02-20", isCertificateIssued: false, programTitle: "Public Speaking Mastery", programId: "mmp-1" },
            { id: "m3", name: "Siddharth Tiwari", email: "sid@example.com", completionPercentage: 82, joinedDate: "2025-01-15", lastActiveDate: "2025-03-10", isCertificateIssued: false, programTitle: "Public Speaking Mastery", programId: "mmp-1" },
            { id: "m4", name: "Meera Desai", email: "meera@example.com", completionPercentage: 38, joinedDate: "2025-01-20", lastActiveDate: "2025-02-05", isCertificateIssued: false, programTitle: "Public Speaking Mastery", programId: "mmp-1" },
        ],
    },
    {
        id: "mmp-2",
        title: "Digital Marketing Bootcamp",
        startDate: "2025-02-10",
        endDate: "2025-04-10",
        participants: [
            { id: "m5", name: "Aditya Kumar", email: "aditya@example.com", completionPercentage: 100, joinedDate: "2025-02-10", lastActiveDate: "2025-04-09", isCertificateIssued: true, programTitle: "Digital Marketing Bootcamp", programId: "mmp-2" },
            { id: "m6", name: "Riya Shah", email: "riya@example.com", completionPercentage: 77, joinedDate: "2025-02-11", lastActiveDate: "2025-04-05", isCertificateIssued: false, programTitle: "Digital Marketing Bootcamp", programId: "mmp-2" },
            { id: "m7", name: "Harsh Pandey", email: "harsh@example.com", completionPercentage: 65, joinedDate: "2025-02-10", lastActiveDate: "2025-03-28", isCertificateIssued: false, programTitle: "Digital Marketing Bootcamp", programId: "mmp-2" },
            { id: "m8", name: "Simran Kaur", email: "simran@example.com", completionPercentage: 41, joinedDate: "2025-02-15", lastActiveDate: "2025-03-01", isCertificateIssued: false, programTitle: "Digital Marketing Bootcamp", programId: "mmp-2" },
            { id: "m9", name: "Varun Mathur", email: "varun@example.com", completionPercentage: 88, joinedDate: "2025-02-10", lastActiveDate: "2025-04-08", isCertificateIssued: false, programTitle: "Digital Marketing Bootcamp", programId: "mmp-2" },
        ],
    },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const getStatus = (p: Participant): "eligible" | "not_eligible" | "issued" => {
    if (p.isCertificateIssued) return "issued";
    if (p.completionPercentage >= 75) return "eligible";
    return "not_eligible";
};

const fetchChallengeParticipantsProgress = async () => {
    const res = await axios.get(
        "/api/challenge/my-challenge/participants-progress"
    );
    return res.data.participants;
};
const fetchMMPParticipantsProgress = async () => {
    const res = await axios.get(
        "/api/mini-mastery-programs/participants-progress"
    );
    return res.data.participants;
};

// ─────────────────────────────────────────────
//  SIGNATURE PAD COMPONENT
// ─────────────────────────────────────────────
export function SignaturePadDialog({
    open,
    onClose,
    onSave,
    isUploading
}: {
    open: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
    isUploading: boolean;

}) {
    const padRef = useRef<SignaturePad>(null);



    const handleClear = () => {
        padRef.current?.clear();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Sign Your Signature</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-3">
                    <SignaturePad
                        ref={padRef}
                        penColor="#000"
                        canvasProps={{
                            width: 450,
                            height: 200,
                            className: "border rounded-md bg-white",
                        }}
                    />

                    <div className="flex gap-4 pt-3">
                        <Button
                            variant="secondary"
                            onClick={handleClear}
                            disabled={isUploading}
                        >
                            Clear
                        </Button>

                        <Button
                            onClick={async () => {
                                if (!padRef.current) return;
                                const dataUrl = padRef.current.getCanvas().toDataURL("image/png");
                                await onSave(dataUrl); // wait for upload
                            }}
                            disabled={isUploading}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Signature"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────
//  SIGNATURE DIALOG
// ─────────────────────────────────────────────
interface SignatureDialogProps {
    open: boolean;
    onClose: () => void;
    onOpenPad: () => void;
    isUploading: boolean;
    onUploadImage: (file: File) => Promise<void>;
    onSaveText: (text: string) => Promise<void>;
    signaturePreview: string | null;
    signatureTextPreview: string | null;
}

export function SignatureDialog({
    open,
    onClose,
    onOpenPad,
    isUploading,
    onUploadImage,
    onSaveText,
    signaturePreview,
    signatureTextPreview
}: SignatureDialogProps) {
    const [mode, setMode] = useState<"upload" | "text" | null>(null);
    const [sigText, setSigText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setMode(null);
        }
    }, [open]);
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <PenLine className="w-4 h-4 text-indigo-600" />
                        Manage Certificate Signature
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Choose how you would like to add your signature to all issued
                        certificates.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 flex flex-col gap-4">
                    {/* Options Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setMode("upload")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all ${mode === "upload"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            <Upload className="w-5 h-5" />
                            Upload Image
                        </button>
                        <button
                            onClick={() => setMode("text")}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all ${mode === "text"
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            <PenLine className="w-5 h-5" />
                            Type Text
                        </button>
                        <button
                            onClick={() => {
                                setMode(null);
                                onOpenPad();
                            }}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl border text-[13px] font-medium transition-all border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        >
                            <Pencil className="w-5 h-5" />
                            Draw Pad
                        </button>
                    </div>

                    {/* Current Signature Preview */}
                    {(signaturePreview || signatureTextPreview) && (
                        <div className="border rounded-xl p-4 bg-white text-center">
                            <p className="text-xs font-semibold text-slate-500 mb-2">
                                Current Signature
                            </p>

                            {signaturePreview && (
                                <img
                                    src={signaturePreview}
                                    alt="Signature preview"
                                    className="h-16 mx-auto object-contain"
                                />
                            )}

                            {signatureTextPreview && (
                                <p className={`text-3xl text-[#1E3A8A] ${greatVibes.className}`}>
                                    {signatureTextPreview}
                                </p>
                            )}
                        </div>
                    )}
                    {/* Loading Indicator */}


                    {/* Upload Mode */}
                    {mode === "upload" && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Upload New Signature
                            </p>

                            <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setSelectedFile(file);
                                }}
                                className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:cursor-pointer"
                            />

                            {previewUrl && (
                                <div className="border rounded-xl p-4 bg-white text-center">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">
                                        New Preview
                                    </p>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-16 mx-auto object-contain"
                                    />
                                </div>
                            )}

                            <Button
                                disabled={!selectedFile || isUploading}
                                onClick={() => {
                                    if (!selectedFile) return;
                                    onUploadImage(selectedFile);
                                    setSelectedFile(null);
                                }}
                                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload New Signature"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Text Mode */}
                    {mode === "text" && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Type Signature
                            </p>
                            <Input
                                placeholder="Your name or signature…"
                                value={sigText}
                                disabled={isUploading}
                                onChange={(e) => setSigText(e.target.value)}
                                className="h-9 text-sm"
                            />
                            {sigText && !isUploading && (
                                <div className="border rounded-xl p-4 bg-white text-center">
                                    <p className={`text-3xl text-slate-700 ${greatVibes.className}`}>
                                        {sigText}
                                    </p>
                                </div>
                            )}
                            <Button
                                disabled={!sigText || isUploading}
                                onClick={() => onSaveText(sigText)}
                                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            >
                                Save Signature
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────
//  PARTICIPANTS TABLE
// ─────────────────────────────────────────────
type ParticipantsTableProps = {
    programs: ProgramRow[];
    isLoading?: boolean;
    onIssue: (participantId: string, programId: string) => void;
    onPreview: (participantId: string, programId: string, name: string) => void;
    issuingId: string | null;
    activeTab: "challenges" | "mmp";
    setActiveTab: (tab: "challenges" | "mmp") => void;
};

function ParticipantsTable({ programs, isLoading = false, onIssue, onPreview, issuingId, activeTab, setActiveTab }: ParticipantsTableProps) {
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");

    const allParticipants: Participant[] = programs.flatMap((p) => p.participants);

    const filtered = allParticipants.filter((p) => {
        const matchFilter =
            filter === "all" ||
            (filter === "eligible" && getStatus(p) === "eligible") ||
            (filter === "not_eligible" && getStatus(p) === "not_eligible") ||
            (filter === "issued" && getStatus(p) === "issued");

        const matchSearch =
            search === "" ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase()) ||
            p.programTitle.toLowerCase().includes(search.toLowerCase());

        return matchFilter && matchSearch;
    });



    const handleIssueClick = (p: Participant) => {
        onIssue(p.id, p.programId);
    };

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                        placeholder="Search by name, challenge or program…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
                <Select
                    value={filter}
                    onValueChange={(v) => setFilter(v as FilterType)}
                >
                    <SelectTrigger className="w-44 h-9 text-sm">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Participants</SelectItem>
                        <SelectItem value="eligible">Eligible</SelectItem>
                        <SelectItem value="not_eligible">Not Eligible</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card className="overflow-x-auto w-full border rounded-lg">
                {/* ── Tabs ── */}
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as "challenges" | "mmp")}
                    className="mb-6 flex justify-center "
                >
                    <TabsList className="flex flex-row w-full sm:w-auto">
                        <TabsTrigger value="challenges" className="flex items-center text-xs sm:text-sm gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Challenges
                        </TabsTrigger>
                        <TabsTrigger value="mmp" className="flex items-center text-xs sm:text-sm gap-2">
                            <Layers className="w-3.5 h-3.5" />
                            Mini Mastery Programs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="challenges" />
                    <TabsContent value="mmp" />
                </Tabs>
                <CardContent>
                    <Table className="min-w-[780px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Participant</TableHead>
                                <TableHead>
                                    {activeTab === "challenges" ? "Challenge" : "Program"}
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading data...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No participants found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((p) => {
                                    const status = getStatus(p);
                                    const isIssuingThis = issuingId === p.id;

                                    return (
                                        <TableRow key={`${p.id}-${p.programId}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">{p.name}</span>
                                                        <span className="text-xs text-muted-foreground">{p.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="inline-flex items-center text-xs font-medium rounded-md px-2 py-0.5 max-w-[180px] truncate">
                                                    {p.programTitle}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        status === "issued"
                                                            ? "default"
                                                            : status === "eligible"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {status === "issued" ? "Issued" : status === "eligible" ? "Eligible" : "Not Eligible"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                   
                                                    <span className="text-xs font-semibold text-slate-600">
                                                        {p.completionPercentage}%
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-xs text-muted-foreground">
                                                Joined: {format(new Date(p.joinedDate), "MMM d, yyyy")}
                                                <br />
                                                Active: {format(new Date(p.lastActiveDate), "MMM d, yyyy")}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                        {activeTab === "challenges" && status === "eligible" && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleIssueClick(p)}
                                                                disabled={isIssuingThis}
                                                            >
                                                                <Award className="mr-2 h-4 w-4 text-indigo-600" />
                                                                {isIssuingThis ? "Issuing..." : "Issue Certificate"}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {p.isCertificateIssued && (
                                                            <DropdownMenuItem
                                                                onClick={() => onPreview(p.id, p.programId, p.name)}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                                Preview Certificate
                                                            </DropdownMenuItem>
                                                        )}

                                                        {status === "not_eligible" && (
                                                            <DropdownMenuItem disabled>
                                                                <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Not Eligible Yet
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <User className="mr-2 h-4 w-4" /> 
                                                        </DropdownMenuItem> */}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
export default function CertificateManagementPage() {
    const session = useSession();
    const [activeTab, setActiveTab] = useState<"challenges" | "mmp">("challenges");
    const [sigDialogOpen, setSigDialogOpen] = useState(false);
    const [issuingId, setIssuingId] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewParticipantName, setPreviewParticipantName] = useState("");

    const { data, isLoading: isChallengesLoading } = useQuery({
        queryKey: ["participants-progress"],
        queryFn: fetchChallengeParticipantsProgress,
        enabled: !!session?.data?.user && activeTab === "challenges",
    });
    const { data: signatureData } = useQuery<SignatureResponse>({
        queryKey: ["coach-signature"],
        queryFn: async () => {
            const res = await axios.get(`/api/signature`);
            return res.data;
        }
    });
    const { data: mmpData, isLoading: isMmpLoading } = useQuery({
        queryKey: ["mmp-participants-progress"],
        queryFn: fetchMMPParticipantsProgress,
        enabled: !!session?.data?.user,
    });

    const issueCertificateMutation = useMutation({
        mutationFn: async ({
            participantId,
            challengeId,
            issuedById,
        }: {
            participantId: string;
            challengeId: string;
            issuedById: string;
        }) => {
            setIssuingId(participantId);

            // SHOW LOADING TOAST
            toast.loading("Generating certificate...", {
                id: "cert-issue",
            });

            const res = await axios.post("/api/challenge/certificates/generate", {
                participantId,
                challengeId,
                issuedById,
            });

            return res.data;
        },

        onSuccess: (result, variables) => {
            setIssuingId(null);

            // UPDATE CACHE
            queryClient.setQueryData<ParticipantsProgressResponse[]>(
                ["participants-progress"],
                (oldData) => {
                    if (!oldData) return oldData;

                    return oldData.map((p) =>
                        p.participantId === variables.participantId &&
                            p.programId === variables.challengeId
                            ? {
                                ...p,
                                isCertificateIssued: true,
                                certificateUrl: result.pngUrl,
                            }
                            : p
                    );
                }
            );

            const participantName =
                allParticipants.find((p) => p.id === variables.participantId)?.name ??
                "Participant";

            setPreviewUrl(result.pngUrl);
            setPreviewParticipantName(participantName);
            setPreviewOpen(true);

            // UPDATE TOAST → SUCCESS
            toast.success(`Certificate issued to ${participantName}`, {
                id: "cert-issue",
            });
        },

        onError: () => {
            setIssuingId(null);

            // UPDATE TOAST → ERROR
            toast.error("Failed to issue certificate", {
                id: "cert-issue",
            });
        },
    });
    const signaturePreviewData =
        signatureData?.signature?.type === "IMAGE" ||
            signatureData?.signature?.type === "DRAWN"
            ? signatureData?.signature?.imageUrl
            : null;

    const signatureTextPreviewData =
        signatureData?.signature?.type === "TEXT"
            ? signatureData?.signature?.text
            : null;
    const { challengePrograms, mmpPrograms } = useMemo(() => {
        const challengeSource = data || [];
        const mmpSource = mmpData || [];
        const combined = [...challengeSource, ...mmpSource];

        if (combined.length === 0)
            return { challengePrograms: [], mmpPrograms: [] };

        const challengeGrouped: Record<string, ProgramRow> = {};
        const mmpGrouped: Record<string, ProgramRow> = {};

        combined.forEach((p: any) => {
            const target = p.programType === "CHALLENGE" ? challengeGrouped : mmpGrouped;

            if (!target[p.programId]) {
                target[p.programId] = {
                    id: p.programId,
                    title: p.programTitle,
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    participants: [],
                };
            }

            target[p.programId].participants.push({
                id: p.participantId,
                name: p.name,
                email: p.email,
                completionPercentage: p.completionPercentage,
                joinedDate: p.joinedAt,
                lastActiveDate: p.lastActiveDate,
                isCertificateIssued: p.isCertificateIssued,
                programTitle: p.programTitle,
                programId: p.programId,
                certificateUrl: p.certificateUrl,
            });
        });

        return {
            challengePrograms: Object.values(challengeGrouped),
            mmpPrograms: Object.values(mmpGrouped),
        };
    }, [data, mmpData]);

    // FINAL separation
    const activeData =
        activeTab === "challenges" ? challengePrograms : mmpPrograms;

    const isActiveLoading =
        activeTab === "challenges" ? isChallengesLoading : isMmpLoading;

    // Signature State Handlers
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [isSignatureUploading, setIsSignatureUploading] = useState(false);
    const queryClient = useQueryClient();



    const handleIssue = (participantId: string, programId: string) => {
        issueCertificateMutation.mutate({
            participantId,
            challengeId: programId,
            issuedById: session.data?.user?.id as string,
        });
    };

    const handlePreview = (
        participantId: string,
        programId: string,
        name: string
    ) => {
        const participant = allParticipants.find(
            (p) => p.id === participantId && p.programId === programId
        );

        if (!participant?.certificateUrl) {
            toast.error("Certificate not found");
            return;
        }

        setPreviewUrl(participant.certificateUrl);
        setPreviewParticipantName(name);
        setPreviewOpen(true);
    };

    const allParticipants = activeData.flatMap((c) => c.participants);
    const totalEligible = allParticipants.filter(
        (p) => p.completionPercentage >= 75 && !p.isCertificateIssued
    ).length;
    const totalIssued = allParticipants.filter(
        (p) => p.isCertificateIssued
    ).length;
    const totalNotEligible = allParticipants.filter(
        (p) => p.completionPercentage < 75 && !p.isCertificateIssued
    ).length;

    const uploadSignatureAxios = async (
        form: FormData
    ): Promise<string | null> => {
        try {
            setIsSignatureUploading(true);
            const { data } = await axios.post("/api/signature", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // For IMAGE / DRAWN signatures, backend returns `imageUrl`
            const imageUrl: string | null = data?.signature?.imageUrl ?? null;
            return imageUrl;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(
                    error.response?.data?.error ||
                    error.message ||
                    "Signature upload failed"
                );
            } else {
                toast.error("Signature upload failed");
            }
            throw error;
        } finally {
            setIsSignatureUploading(false);
        }
    };

    return (
        <>
            {/* Main Upload / Text UI Dialog */}
            <SignatureDialog
                open={sigDialogOpen}
                onClose={() => setSigDialogOpen(false)}
                onOpenPad={() => setShowSignaturePad(true)}
                isUploading={isSignatureUploading}
                signaturePreview={signaturePreviewData}
                signatureTextPreview={signatureTextPreviewData}
                onUploadImage={async (file) => {
                    const form = new FormData();
                    form.append("type", "IMAGE");
                    form.append("file", file);

                    const imageUrl = await uploadSignatureAxios(form);

                    if (imageUrl) {
                        queryClient.setQueryData<SignatureResponse>(["coach-signature"], (oldData) => {
                            if (!oldData) return oldData;

                            return {
                                signature: {
                                    id: oldData.signature.id,
                                    userId: oldData.signature.userId,
                                    createdAt: oldData.signature.createdAt,
                                    type: "IMAGE",
                                    imageUrl: imageUrl,
                                    text: null,
                                },
                            };
                        });

                        toast.success("Signature image saved.");
                        setSigDialogOpen(false); // ← ADD THIS LINE
                    }
                }}
                onSaveText={async (text) => {
                    const form = new FormData();
                    form.append("type", "TEXT");
                    form.append("text", text);
                    await uploadSignatureAxios(form);
                    queryClient.setQueryData<SignatureResponse>(["coach-signature"], (oldData) => {
                        if (!oldData) return oldData;

                        return {
                            signature: {
                                id: oldData.signature.id,
                                userId: oldData.signature.userId,
                                createdAt: oldData.signature.createdAt,
                                type: "TEXT",
                                text: text,
                                imageUrl: null,
                            },
                        };
                    });
                    toast.success("Signature text saved.");
                    setSigDialogOpen(false); // Closes the dialog after saving
                }}
            />

            {/* Drawing Pad Dialog */}
            <SignaturePadDialog
                open={showSignaturePad}
                onClose={() => setShowSignaturePad(false)}
                isUploading={isSignatureUploading}
                onSave={async (dataUrl: string) => {
                    const form = new FormData();
                    form.append("type", "DRAWN");
                    form.append("dataUrl", dataUrl);

                    const imageUrl = await uploadSignatureAxios(form);

                    if (imageUrl) {
                        queryClient.setQueryData<SignatureResponse>(["coach-signature"], (oldData) => {
                            if (!oldData) return oldData;

                            return {
                                signature: {
                                    id: oldData.signature.id,
                                    userId: oldData.signature.userId,
                                    createdAt: oldData.signature.createdAt,
                                    type: "DRAWN",
                                    imageUrl: imageUrl,
                                    text: null,
                                },
                            };
                        });

                        toast.success("Drawn signature saved.");
                        setShowSignaturePad(false); // CLOSE AFTER SUCCESS
                    }
                }}
            />
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Certificate Preview</DialogTitle>
                        <DialogDescription>
                            Certificate issued to {previewParticipantName}
                        </DialogDescription>
                    </DialogHeader>

                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Certificate Preview"
                            className="w-full rounded-lg border"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-3xl font-bold">Certificate Management</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Issue certificates to eligible participants and manage your
                            certificate signature.
                        </p>
                    </div>

                    <button
                        onClick={() => setSigDialogOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                    >
                        Manage Signature
                    </button>
                </div>

                {/* ── Summary Stats ── */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Eligible
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">
                            {totalEligible}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Not Eligible
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-rose-500">
                            {totalNotEligible}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Issued
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-600">{totalIssued}</p>
                    </div>
                </div>



                {/* ── Table Panel ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            {activeTab === "challenges"
                                ? "Challenge Participants"
                                : "Mini Mastery Program Participants"}
                        </h2>
                        <p className="text-xs text-slate-400">
                            {allParticipants.length} participants across {activeData.length}{" "}
                            {activeTab === "challenges" ? "challenges" : "programs"}
                        </p>
                    </div>

                    <ParticipantsTable
                        programs={activeData}
                        isLoading={isActiveLoading}
                        onIssue={handleIssue}
                        issuingId={issuingId}
                        activeTab={activeTab}
                        onPreview={handlePreview}
                        setActiveTab={setActiveTab}
                    />
                </div>
            </div>
        </>
    );
}