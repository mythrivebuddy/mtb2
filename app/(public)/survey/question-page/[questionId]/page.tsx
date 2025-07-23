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
  // const index = parseInt(questionId)
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
          const remainingMs = response.data.remainingMs || 0;
          const minutesLeft = Math.ceil(remainingMs / 60000);
          const hours = Math.floor(minutesLeft / 60);
          const minutes = minutesLeft % 60;
            await axios.post("/api/survey/update-last-survey-time", { userId });
          toast.error(`Please wait ${hours}h ${minutes}m before continuing the survey.`);
          router.push("/survey");
        }
      } catch (err) {
        const error = err as AxiosError<{ remainingMs?: number }>;
        const remainingMs = error.response?.data?.remainingMs ?? 0;
        const minutesLeft = Math.ceil(remainingMs / 60000);
        const hours = Math.floor(minutesLeft / 60);
        const minutes = minutesLeft % 60;

        toast.error(`Please wait ${hours}h ${minutes}m before continuing the survey.`);
        router.push("/survey");
      } finally {
        setChecked(true);
      }
    };

    if (status === "authenticated") {
      checkAccess();
    }
  }, [status, session, router]);

  if (!checked || !allowed) return null;

  return (
    <AppLayout>
      <QuestionPageComponent questionId={questionId} />
    </AppLayout>
  );
}
