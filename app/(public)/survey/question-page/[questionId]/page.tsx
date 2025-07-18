"use client"
import AppLayout from "@/components/layout/AppLayout";
import QuestionPageComponent from "@/components/survey/QuestionPage";
import { useParams } from "next/navigation";

export default function QuestionPage() {
    const params = useParams();
    const questionId = params.questionId as string;
  return (
    <AppLayout>
      <QuestionPageComponent questionId={questionId} />
    </AppLayout>
  );
}