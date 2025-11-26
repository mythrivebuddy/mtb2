/* eslint-disable react/no-unescaped-entities */
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import CertificateActions from "./_components/CertificateActions"; 
import { Metadata } from "next";

interface Props {
  params: Promise<{ challengeId: string }>;
}

// ---------------------------------------------------------
// 1. DYNAMIC METADATA (For LinkedIn Preview)
// ---------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { challengeId } = await params;

  // We find first by challengeId (Assuming 1 cert per challenge for simplicity in metadata)
  const certificate = await prisma.challengeCertificate.findFirst({
    where: { challengeId },
    include: { challenge: true, participant: true },
  });

  const pdfUrl = certificate?.certificateUrl;
  const imageUrl = pdfUrl?.replace(".pdf", ".png");
  const title = certificate?.challenge?.title || "Challenge";

  return {
    title: `Achievement Unlocked | ${title}`,
    description: `I just completed the ${title} challenge!`,
    openGraph: {
      title: `Certificate: ${title}`,
      description: `Awarded to ${certificate?.participant?.name || "Participant"}`,
      type: "article",
      images: [
        {
          url: imageUrl || "/logo.png",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

// ---------------------------------------------------------
// 2. PAGE COMPONENT
// ---------------------------------------------------------
export default async function MyAchievementsPage({ params }: Props) {
  const { challengeId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Fetch Certificate + Relations (Challenge & Participant)
  const certificate = await prisma.challengeCertificate.findFirst({
    where: {
      participantId: user?.id,
      challengeId: challengeId,
    },
    include: {
      challenge: true,
      participant: true,
    },
  });

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <h2 className="text-2xl font-bold text-gray-700">No Certificate Found</h2>
        <p className="text-gray-500">You haven't completed this challenge yet.</p>
      </div>
    );
  }

  const pdfUrl = certificate.certificateUrl;
  const imageUrl = pdfUrl?.replace(".pdf", ".png");
  const challengeTitle = certificate.challenge.title;

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${certificate.certificateId}`;

  return (
    <div className="max-w-3xl mx-auto px-4 mt-12 mb-20">
      {/* Header With Buttons */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-600 text-center">🏆 Congratulations!</h1>
        <p className="text-gray-700 text-lg mt-2 text-center">
          You’ve successfully completed <strong>{challengeTitle}</strong>.
          <br /> Here is your certificate!
        </p>

        {/* Client Component for Download & Share Logic */}
        {imageUrl && (
          <CertificateActions imageUrl={imageUrl}  shareUrl={shareUrl} />
        )}
      </div>

      {/* Certificate Image Display */}
      <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Certificate"
            className="w-full h-auto object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50">
            <span className="text-lg">Generating Certificate...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          Keep going — more achievements await you! 🚀
        </p>
      </div>
    </div>
  );
}