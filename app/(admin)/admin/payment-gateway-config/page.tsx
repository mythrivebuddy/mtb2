import React from "react";
import { CashfreeEnvironment } from "./_components/CashfreeEnvironment";
import { RazorpayEnvironment } from "./_components/RazorpayEnvironment";


export default function PaymentGatewayEnvironmentPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CashfreeEnvironment />
      <RazorpayEnvironment/>
    </div>
  );
}