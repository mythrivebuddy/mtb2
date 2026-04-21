import MMPEnrolledStudentsPageComponent from "@/components/mini-mastery-program/MMPEnrolledStudentsPageComponent";

export default async function MmpEnrolledStudentsAdminPage({
  searchParams,
}: {
  searchParams: { programId?: string };
}) {
  const { programId } = await searchParams;

  return (
    <>
      <header className="px-6 ">
        <h1 className="text-2xl">Enrolled Students</h1>
      </header>
      <MMPEnrolledStudentsPageComponent programId={programId} />
    </>
  );
}
