import Navbar from "@/components/common/Navbar";

export default async function page() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] py-4 sm:py-6 md:py-8 px-4">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-4 sm:p-6 md:p-8">
            <Navbar />
            <h1>Hello</h1>
          </div>
        </div>
      </main>
    </>
  );
}
