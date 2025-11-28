import AppLayout from "@/components/layout/AppLayout";
import axios from "axios";
import { BadgeCheckIcon } from "lucide-react";

export default async function VerifyChallengeCertificatePage({
  params,
}: {
  params: { certificateId: string };
}) {
  const {certificateId} = await params;

  let data = null;

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/certificates/verify?id=${certificateId}`,
      { validateStatus: () => true } // allow 400/404 responses
    );
    data = res.data;
  } catch (err) {
    data = { valid: false };
    console.log(err);
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-20 text-center">

        {/* INVALID */}
        {!data.valid && (
          <div>
            <h1 className="text-3xl font-bold text-red-500">
              Invalid Certificate
            </h1>
            <p className="text-gray-600 mt-3">
              This certificate does not exist or failed verification.
            </p>
          </div>
        )}

        {/* VALID */}
        {data.valid && (
          <div>
            <h1 className="text-3xl font-bold text-green-600 mb-6 flex gap-1 justify-center items-center">
            <BadgeCheckIcon className="inline-block mr-1" size={28}/>   Certificate Verified
            </h1>

            <p className="text-lg text-gray-800 font-medium">
              Issued To: {data.certificate.participantName}
            </p>

            <p className="text-gray-600 mt-2">
              Challenge: {data.certificate.challengeName}
            </p>

            <p className="text-gray-600">
              Issued By: {data.certificate.issuedBy}
            </p>

            <p className="text-gray-600 mb-6">
              Certificate ID: {data.certificate.certificateId}
            </p>

            {/* Certificate Image/PDF */}
            <img
              src={data.certificate.certificateUrl} 
              className="w-full sm:h-[600px] border rounded-sm "
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
