"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default  function MembershipPage() {
  // Fetch plans (server component safe)
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription-plans`,
        { credentials: "include" }
      );

      const data = await res.json();
      console.log(data);
      setPlans(data);
    };
    fetchPlans();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Membership Plans</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans?.map((plan: any) => {
          const intervalLabel =
            plan.interval === "MONTHLY"
              ? "Monthly"
              : plan.interval === "YEARLY"
                ? "Yearly"
                : "Lifetime";

          const isLifetime = plan.interval === "LIFETIME";

          return (
            <div
              key={plan.id}
              className="border rounded-xl shadow-sm p-6 bg-white flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                    {intervalLabel}
                  </span>

                  <span className="text-xs px-2 py-1 rounded bg-gray-200">
                    {plan.userType}
                  </span>
                </div>

                <h2 className="text-xl font-bold mt-4">{plan.name}</h2>

                {plan.description && (
                  <p className="text-gray-600 mt-2 text-sm">
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="mt-6">
                <div className="text-3xl font-bold text-gray-900">
                  ₹{plan.amountINR.toLocaleString()} + GST
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  USD ${plan.amountUSD}
                </div>

                {!isLifetime && (
                  <p className="text-xs text-gray-500 mt-2">
                    Renews automatically
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Link href={`/dashboard/membership/checkout?plan=${plan.id}`}>
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                  >
                    {isLifetime ? "Buy Lifetime Access" : "Subscribe"}
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
