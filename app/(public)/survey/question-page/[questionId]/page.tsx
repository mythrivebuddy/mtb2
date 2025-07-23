"use client";

import AppLayout from "@/components/layout/AppLayout";
import QuestionPageComponent from "@/components/survey/QuestionPage";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function QuestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      try {
        const { data } = await axios.post("/api/survey/validate-survey-access", { userId });
        if (!data.success) {
          const minutesLeft = Math.ceil((data.remainingMs || 0) / 60000);
          const hours = Math.floor(minutesLeft / 60);
          const minutes = minutesLeft % 60;
          toast.error(`Please wait ${hours}h ${minutes}m before continuing the survey.`);
          router.push("/survey");
        } else {
          setAllowed(true);
        }
      } catch (err) {
        console.error("Error checking access:", err);
        toast.error("Error checking survey access.");
        router.push("/survey");
      }
    };

    if (status === "authenticated") checkAccess();
  }, [session, status]);

  if (!allowed) return null;

  return (
    <AppLayout>
      <QuestionPageComponent questionId={questionId} />
    </AppLayout>
  );
}
