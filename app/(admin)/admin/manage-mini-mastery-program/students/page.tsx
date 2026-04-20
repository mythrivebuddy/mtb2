import MMPEnrolledStudentsPageComponent from "@/components/mini-mastery-program/MMPEnrolledStudentsPageComponent";

export default async function MmpEnrolledStudentsAdminPage({
  searchParams,
}: {
  searchParams: { programId?: string };
}) {
  const {programId} = await searchParams;

  return <MMPEnrolledStudentsPageComponent programId={programId} />;
}
