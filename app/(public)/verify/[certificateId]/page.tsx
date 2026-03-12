import AppLayout from "@/components/layout/AppLayout";
import axios from "axios";
import { BadgeCheckIcon, BookOpen, Trophy } from "lucide-react";

export default async function VerifyChallengeCertificatePage({
  params,
}: {
  params: { certificateId: string };
}) {
  const { certificateId } = await params;
  console.log(certificateId)

  let data: {
    valid: boolean;
    type?: "challenge" | "mini-mastery";
    certificate?: {
      certificateId:    string;
      participantName:  string;
      participantEmail: string;
      challengeName:    string;
      issuedBy:         string;
      issuedAt:         string;
      certificateUrl:   string;
    };
  } = { valid: false };

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/certificates/verify?id=${certificateId}`,
      { validateStatus: () => true }
    );
    data = res.data;
    console.log(data)
  } catch (err) {
    data = { valid: false };
    console.log(err);
  }

  const isMiniMastery = data.type === "mini-mastery";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-20 text-center">

        {/* ── INVALID ── */}
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

        {/* ── VALID ── */}
        {data.valid && data.certificate && (
          <div>
            {/* Type badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {isMiniMastery ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  <BookOpen size={13} /> Mini-Mastery Program
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  <Trophy size={13} /> Challenge
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-green-600 mb-6 flex gap-1 justify-center items-center">
              <BadgeCheckIcon className="inline-block mr-1" size={28} />
              Certificate Verified
            </h1>

            <p className="text-lg text-gray-800 font-medium">
              Issued To: {data.certificate.participantName}
            </p>

            <p className="text-gray-600 mt-2">
              {isMiniMastery ? "Program" : "Challenge"}: {data.certificate.challengeName}
            </p>

            <p className="text-gray-600">
              Issued By: {data.certificate.issuedBy}
            </p>

            <p className="text-gray-600 mb-6">
              Certificate ID: {data.certificate.certificateId}
            </p>

            {/* Certificate image */}
            <img
              src={data.certificate.certificateUrl}
              alt={`Certificate for ${data.certificate.participantName}`}
              className="w-full sm:h-[600px] border rounded-sm"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}