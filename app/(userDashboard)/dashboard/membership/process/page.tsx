// app/dashboard/membership/process/page.tsx
import axios from "axios";

export default async function ProcessPage({ searchParams }: any) {
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
        <a
          href="/dashboard/membership/success"
          className="text-blue-600 underline"
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Verification Failed</h1>
      <a
        href="/dashboard/membership/failure"
        className="text-red-600 underline"
      >
        Continue
      </a>
    </div>
  );
}
