// app/dashboard/membership/process/page.tsx
import axios from "axios";
import Link from "next/link";


export default async function ProcessPage({ searchParams }: { searchParams: { order_id: string } }) {
  const orderId = searchParams.order_id;

  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/verify-mandate`,
    { orderId },
    { withCredentials: true }
  );

  if (data.success) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Payment Verified</h1>
        <p>Your membership has been activated.</p>
        <Link
          href="/dashboard/membership/success"
          className="text-blue-600 underline"
        >
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Verification Failed</h1>
      <Link
        href="/dashboard/membership/failure"
        className="text-red-600 underline"
      >
        Continue
      </Link>
    </div>
  );
}
