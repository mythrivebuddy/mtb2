'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export default function SurveyModal() {
  return (
    <div className="my-16 flex justify-center items-center z-50">
      <Card className="flex flex-col md:flex-row w-full max-w-4xl rounded-xl overflow-hidden shadow-lg">
        {/* Left Side Image */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto">
          <Image
            src="/image2.png"
            alt="Illustration"
            fill
            className="object-cover"
          />
        </div>

        {/* Right Side Text */}
        <CardContent className="w-full md:w-1/2 p-6 space-y-4">
          <h2 className="text-2xl font-bold">
            Thank you — You&apos;ve completed your session.
          </h2>

          <p className="text-gray-600">
            Your responses are now locked into the Solopreneur Vault.
            <br />
            Your next session will unlock in 4 hours.
            <br />
            Come back then to answer more — the collective grows one mindful answer at a time.
          </p>

          <p className="text-gray-500 text-sm">
            You&apos;re one of 10,000+ solopreneurs building the future.
          </p>

          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition"
          >
            Share the survey with your solopreneur circle
          </button>

          <div className="flex justify-center space-x-6 text-blue-600 text-sm pt-2">
            <a href="#">WhatsApp</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram Story</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
