// src/app/survey/question-page/[questionId]/page.tsx

"use client";

import AppLayout from "@/components/layout/AppLayout";
import QuestionPageComponent from "@/components/survey/QuestionPage";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export default function QuestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;

  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      try {
        const response = await axios.post("/api/survey/validate-survey-access", { userId });
        if (response.data.success) {
          setAllowed(true);
        } else {
          // This block should NOT exist. The API already denied access.
          // Don't show a success-based error message here.
          // Let the catch block handle the error toast.
        }
      } catch (err) {
        // The validation API returns a 403 status on cooldown, so we handle it here.
        const error = err as AxiosError<{ remainingMs?: number }>;
        const remainingMs = error.response?.data?.remainingMs ?? 0;
        const minutesLeft = Math.ceil(remainingMs / 60000);
        const hours = Math.floor(minutesLeft / 60);
        const minutes = minutesLeft % 60;

        toast.error(`Please wait ${hours}h ${minutes}m before continuing the survey.`);
        
        // ❌ REMOVE THIS LINE. Do not update the time when access is denied.
        // await axios.post("/api/survey/update-last-survey-time", { userId });

        router.push("/survey");
      } finally {
        setChecked(true);
      }
    };

    if (status === "authenticated") {
      checkAccess();
    }
  }, [status, session, router]);

  if (!checked || !allowed) return null; // Or show a loading spinner

  return (
    <AppLayout>
      <QuestionPageComponent questionId={questionId} />
    </AppLayout>
  );
}