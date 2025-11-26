/* eslint-disable react/no-unescaped-entities */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SignaturePadDialog from "@/components/SignaturePadDialog";
import { Task } from "../page";


interface ChallengeHistory {
  date: string;
  status: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  completedDays: number;
}

export interface ParticipantEntry {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  lastActiveDate: string;
  isCertificateIssued: boolean;
}

interface APIResponse {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  dailyTasks: Task[];
  leaderboard: LeaderboardEntry[];
  history: ChallengeHistory[];
  participants: ParticipantEntry[];
  creatorId: string;
}

interface BuiltParticipant {
  id: string;
  name: string;
  completionPercentage: number;
  joinedDate: string;
  lastActiveDate: string;
  isCertificateIssued: boolean;
}

export default function CertificatesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"eligible" | "not" | "issued">(
    "eligible"
  );

  const [issuingId, setIssuingId] = useState<string | null>(null);

  // preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewParticipantName, setPreviewParticipantName] = useState<
    string | null
  >(null);

  // signature dialog state
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureTextPreview, setSignatureTextPreview] = useState<
    string | null
  >(null);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);

  const { data, isLoading, error } = useQuery<APIResponse>({
    queryKey: ["certificateDetails", slug],
    queryFn: async () => {
      const response = await axios.get(`/api/challenge/my-challenge/${slug}`);
      return response.data;
    },
  });



useEffect(() => {
  const font = new FontFace(
    "MerriweatherSignature",
    "url(/fonts/Merriweather-Regular.ttf)"
  );

  font.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
  });
}, []);

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

  const issueCertificateMutation = useMutation({
    mutationFn: async (participantId: string) => {
      setIssuingId(participantId);
      const res = await axios.post("/api/challenge/certificates/generate", {
        participantId,
        challengeId: data?.id,
        issuedById: data?.creatorId,
      });
      return res.data as {
        success: boolean;
        pdfUrl: string;
        certificate: unknown;
        completionPercentage: number;
      };
    },
    onSuccess: (result, participantId) => {
      setIssuingId(null);

      // mark participant as issued in local state
      // Update React Query cache instantly
      queryClient.setQueryData(
        ["certificateDetails", slug],
        (oldData: APIResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            participants: oldData.participants.map((p) =>
              p.id === participantId ? { ...p, isCertificateIssued: true } : p
            ),
          };
        }
      );

      // find the participant for display
      const participantName =
        participants.find((p) => p.id === participantId)?.name ?? "Participant";

      // open preview dialog with the PDF URL
      setPreviewPdfUrl(result.pdfUrl);
      setPreviewParticipantName(participantName);
      setPreviewOpen(true);

      // show success toast
      toast.success(`Certificate issued successfully to ${participantName}.`);

      // If later you store issued certificates in backend:
      // queryClient.invalidateQueries({ queryKey: ["certificateDetails", slug] });
    },
    onError: (err: unknown) => {
      setIssuingId(null);
      console.log("Error issuing certificate:", err);
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.error ||
          err.message ||
          "Failed to issue certificate.";
        toast.error(message);
      } else {
        toast.error("Failed to issue certificate.");
      }
    },
  });

  const issueCertificate = (participantId: string) => {
    if (!data?.id || !data?.creatorId) {
      toast("Challenge or creator information is missing.");
      return;
    }
    issueCertificateMutation.mutate(participantId);
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );

  if (error || !data)
    return (
      <div className="p-4 text-red-500">Failed to load certificate data.</div>
    );

  const challenge = data;

  // ======================================================
  // CALCULATE TOTAL CHALLENGE DAYS (END - START + 1)
  // ======================================================
  const totalChallengeDays =
    Math.floor(
      (new Date(challenge.endDate).getTime() -
        new Date(challenge.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // ======================================================
  // MAP PARTICIPANTS WITH CORRECT COMPLETION FORMULA
  // ======================================================
  const participants: BuiltParticipant[] = challenge.participants.map(
    (p: ParticipantEntry & { lastActiveDate: string }) => {
      const lb = challenge.leaderboard.find(
        (l: LeaderboardEntry) => l.id === p.id
      );

      const completedDays = lb ? lb.completedDays : 0;

      const completionPercentage = Math.round(
        (completedDays / totalChallengeDays) * 100
      );

      return {
        id: p.id,
        name: p.name,
        completionPercentage,
        joinedDate: p.joinedAt,
        lastActiveDate: p.lastActiveDate,
        isCertificateIssued: p.isCertificateIssued ?? false,
      };
    }
  );

  // derive sets for issued participants
  // const issuedIds = new Set(
  //   participants.filter((p) => p.isCertificateIssued).map((p) => p.id)
  // );

  // ======================================================
  // FILTER ELIGIBILITY
  // ======================================================
  const eligible = participants.filter(
    (p: BuiltParticipant) =>
      p.completionPercentage >= 75 && !p.isCertificateIssued
  );

  const notEligible = participants.filter(
    (p: BuiltParticipant) =>
      p.completionPercentage < 75 && !p.isCertificateIssued
  );

  const issued: BuiltParticipant[] = participants.filter(
    (p) => p.isCertificateIssued
  );

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ======================================================
  //   RENDER TABLE (STRICTLY TYPED)
  // ======================================================
  const renderTable = (
    list: BuiltParticipant[],
    type: "eligible" | "not" | "issued"
  ) => {
    if (list.length === 0)
      return (
        <p className="text-gray-500 text-center py-6">
          {type === "issued"
            ? "No certificates issued yet."
            : type === "eligible"
              ? "No eligible participants yet."
              : "No ineligible participants."}
        </p>
      );

    return (
      <div className="overflow-x-auto w-full border rounded-lg">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.map((u: BuiltParticipant) => {
              const isIssued = u.isCertificateIssued;
              const isIssuingThis =
                issuingId === u.id && issueCertificateMutation.isPending;

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold">{u.name}</TableCell>

                  <TableCell>{u.completionPercentage}%</TableCell>

                  <TableCell>{formatDate(u.joinedDate)}</TableCell>

                  <TableCell>{formatDate(u.lastActiveDate)}</TableCell>

                  <TableCell className="text-right">
                    {type === "eligible" && (
                      <>
                        {isIssued ? (
                          <span className="text-green-600 font-semibold">
                            Issued
                          </span>
                        ) : (
                          <button
                            className={`px-3 py-1 rounded-lg text-white ${
                              isIssuingThis
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                            disabled={isIssuingThis}
                            onClick={() => issueCertificate(u.id)}
                          >
                            {isIssuingThis ? "Issuing..." : "Issue"}
                          </button>
                        )}
                      </>
                    )}

                    {type === "not" && (
                      <span className="text-gray-400 text-sm">
                        Not eligible
                      </span>
                    )}

                    {type === "issued" && (
                      <span className="text-green-600 font-semibold">
                        Issued
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      {/* Dialog for Signature Management */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Certificate Signature</DialogTitle>
            <DialogDescription>
              Upload an image, type your signature, or sign using a pad. This
              signature will be used on all certificates you issue.
            </DialogDescription>
          </DialogHeader>

          {/* Action buttons */}
          <div className="flex gap-3 mt-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowImageUpload(true);
                setShowTextInput(false);
                setShowSignaturePad(false);
              }}
              className="px-3 py-2 rounded bg-gray-200 text-sm font-semibold hover:bg-gray-300"
            >
              Upload Signature Image
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTextInput(true);
                setShowImageUpload(false);
                setShowSignaturePad(false);
              }}
              className="px-3 py-2 rounded bg-gray-200 text-sm font-semibold hover:bg-gray-300"
            >
              Type Signature Text
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSignaturePad(true);
                setShowImageUpload(false);
                setShowTextInput(false);
              }}
              className="px-3 py-2 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Sign Using Pad
            </button>
          </div>

          {isSignatureUploading && (
            <p className="mt-2 text-sm text-indigo-600 font-medium">
              Uploading signature...
            </p>
          )}

          {/* IMAGE UPLOAD SECTION */}
          {showImageUpload && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Upload Signature Image
              </p>
              <input
                type="file"
                accept="image/*"
                disabled={isSignatureUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const form = new FormData();
                  form.append("type", "IMAGE");
                  form.append("file", file);

                  const imageUrl = await uploadSignatureAxios(form);
                  if (imageUrl) {
                    setSignaturePreview(imageUrl);
                    setSignatureTextPreview(null);
                    toast.success("Signature image saved.");
                  }
                }}
              />

              {signaturePreview && !isSignatureUploading && (
                <img
                  src={signaturePreview}
                  alt="Signature Preview"
                  className="mt-3 h-20 object-contain border rounded-md p-2 bg-white"
                />
              )}
            </div>
          )}

          {/* TEXT SIGNATURE SECTION */}
   {showTextInput && (
  <>
    

    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-slate-700">Type Your Signature</p>

      <input
        type="text"
        placeholder="Enter your signature text"
        value={signatureTextPreview || ""}
        disabled={isSignatureUploading}
        onChange={(e) => setSignatureTextPreview(e.target.value)}
        className="border rounded px-3 py-2 w-full text-sm"
      />

      <button
        disabled={!signatureTextPreview || isSignatureUploading}
        onClick={async () => {
          if (!signatureTextPreview) return;

          const form = new FormData();
          form.append("type", "TEXT");
          form.append("text", signatureTextPreview);

          await uploadSignatureAxios(form);
          toast.success("Signature text saved.");
        }}
        className="px-3 py-2 rounded bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
      >
        Save Signature
      </button>

      {signatureTextPreview && !isSignatureUploading && (
      <p
  className="mt-2 text-3xl border p-3 rounded bg-white"
  style={{ fontFamily: "MerriweatherSignature" }}
>
  {signatureTextPreview}
</p>

      )}
    </div>
  </>
)}


        </DialogContent>
      </Dialog>

      {/* Separate SignaturePad Dialog (reuses existing component) */}
      <SignaturePadDialog
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={async (dataUrl: string) => {
          const form = new FormData();
          form.append("type", "DRAWN");
          form.append("dataUrl", dataUrl);

          const imageUrl = await uploadSignatureAxios(form);
          if (imageUrl) {
            setSignaturePreview(imageUrl);
            setSignatureTextPreview(null);
            toast.success("Drawn signature saved.");
          }
          setShowSignaturePad(false);
        }}
      />

      {/* Dialog for PDF preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
            <DialogDescription>
              Certificate for {previewParticipantName ?? "participant"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 mt-4">
            {previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border rounded-md"
              />
            ) : (
              <p className="text-gray-500 text-sm">No preview available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Issue certificates to eligible participants and manage your
              certificate signature.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSignatureDialogOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-sm"
            >
              Manage Signature
            </button>

            <button
              onClick={() =>
                router.push(`/dashboard/challenge/my-challenges/${slug}`)
              }
              className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 text-sm"
            >
              Back
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("eligible")}
            className={`pb-2 font-semibold whitespace-nowrap ${
              activeTab === "eligible"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            Eligible
          </button>

          <button
            onClick={() => setActiveTab("not")}
            className={`pb-2 font-semibold whitespace-nowrap ${
              activeTab === "not"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            Not Eligible
          </button>

          <button
            onClick={() => setActiveTab("issued")}
            className={`pb-2 font-semibold whitespace-nowrap ${
              activeTab === "issued"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            Issued
          </button>
        </div>

        {/* ELIGIBLE */}
        {activeTab === "eligible" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Eligible Participants</h2>
            {renderTable(eligible, "eligible")}
          </div>
        )}

        {/* NOT ELIGIBLE */}
        {activeTab === "not" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Not Eligible</h2>
            {renderTable(notEligible, "not")}
          </div>
        )}

        {/* ISSUED */}
        {activeTab === "issued" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Issued Certificates</h2>
            {renderTable(issued, "issued")}
          </div>
        )}
      </div>
    </>
  );
}
