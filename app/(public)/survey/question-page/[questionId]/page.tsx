import AppLayout from "@/components/layout/AppLayout";
import QuestionPageComponent from "@/components/survey/QuestionPage";

export default async function QuestionPage({params}: {params: {questionId: string}}) {
    const { questionId } = await params;
  return (
    <AppLayout>
      <QuestionPageComponent questionId={questionId} />
    </AppLayout>
  );
}
