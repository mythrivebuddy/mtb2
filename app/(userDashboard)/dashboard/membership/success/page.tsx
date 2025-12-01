// app/dashboard/membership/success/page.tsx
export default function SuccessPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-green-700">Payment Successful</h1>
      <p className="mt-4">Your subscription is now active.</p>

      <a
        href="/dashboard/membership/manage"
        className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Manage Subscription
      </a>
    </div>
  );
}
