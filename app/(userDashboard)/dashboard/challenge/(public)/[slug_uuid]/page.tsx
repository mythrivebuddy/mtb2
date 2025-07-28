// CRITICAL: This file MUST be named page.tsx

import { notFound } from "next/navigation";
import React from "react";
import ChallengeDetailClient from "./ChallengeDetailClient";
import { getChallengeData } from "./action";
import type { Metadata } from "next";
import { ChallengeDetailsForClient } from "@/types/client/challengeDetail"; // <-- IMPORT THE NEW TYPE

type PageProps = {
  params: Promise<{ slug_uuid: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const challenge = await getChallengeData((await params).slug_uuid);
  if (!challenge) {
    return { title: "Challenge Not Found" };
  }
  return { title: challenge.title, description: challenge.description };
}

export default async function ChallengeDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
    const challengeData = await getChallengeData((await params).slug_uuid);

    if (!challengeData) {
        notFound();
    }

    // CRITICAL FIX: Convert Date objects to strings before passing to the client.
    const serializableChallenge: ChallengeDetailsForClient = {
        ...challengeData,
        startDate: challengeData.startDate.toISOString(),
        endDate: challengeData.endDate.toISOString(),
    };
    
    return <ChallengeDetailClient challenge={serializableChallenge} />;
}