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
// app/dashboard/membership/process/page.tsx
//
// This page is NOT needed for the Razorpay flow — Razorpay verifies in
// the callback and redirects directly to /success or /failure.
//
// This page is kept only for legacy Cashfree mandate flows that POST to
// /api/billing/verify-mandate. If you've moved entirely to Razorpay,
// you can remove it.

// import Link from "next/link";

// interface ProcessPageProps {
//   searchParams: {
//     order_id?: string;
//     sub_id?: string;
//   };
// }

// export default async function ProcessPage({ searchParams }: ProcessPageProps) {
//   const orderId = searchParams.order_id;
//   const subId = searchParams.sub_id;

//   // Nothing to process for Razorpay — the callback already handled it.
//   // This fallback prevents blank pages if someone lands here incorrectly.
//   if (!orderId && !subId) {
//     return (
//       <div className="p-6 text-center space-y-4">
//         <h1 className="text-2xl font-bold">Nothing to Process</h1>
//         <p className="text-slate-600">
//           No order or subscription ID was provided.
//         </p>
//         <Link href="/dashboard" className="text-blue-600 underline">
//           Go to Dashboard
//         </Link>
//       </div>
//     );
//   }

//   // Cashfree legacy verify (only hit if using old mandate flow)
//   try {
//     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
//     const res = await fetch(`${baseUrl}/api/billing/verify-mandate`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ orderId, subId }),
//       cache: "no-store",
//     });

//     const data = await res.json();

//     if (data.success) {
//       return (
//         <div className="p-6 text-center space-y-4">
//           <h1 className="text-2xl font-bold text-green-700">
//             Payment Verified ✓
//           </h1>
//           <p className="text-slate-600">Your membership has been activated.</p>
//           <Link
//             href="/dashboard/membership/success?type=membership"
//             className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
//           >
//             Continue to Dashboard
//           </Link>
//         </div>
//       );
//     }
//   } catch (e) {
//     console.error("verify-mandate error:", e);
//   }

//   return (
//     <div className="p-6 text-center space-y-4">
//       <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
//       <p className="text-slate-600">
//         We could not verify your payment. If money was debited, please contact
//         support.
//       </p>
//       <Link
//         href="/dashboard/membership/failure?reason=mandate_verify_failed"
//         className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
//       >
//         View Failure Details
//       </Link>
//     </div>
//   );
// }