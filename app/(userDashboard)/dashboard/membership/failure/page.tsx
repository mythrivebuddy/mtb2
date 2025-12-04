import { Link } from "lucide-react";

// app/dashboard/membership/failure/page.tsx
export default function FailurePage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-red-700">Payment Failed</h1>
      <p className="mt-4">Something went wrong. Try again.</p>

      <Link
        href="/dashboard/membership"
        className="mt-6 inline-block bg-gray-700 text-white px-4 py-2 rounded"
      >
        Back to Plans
      </Link>
    </div>
  );
}
