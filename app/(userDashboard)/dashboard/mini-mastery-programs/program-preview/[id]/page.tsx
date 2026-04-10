"use client"

import ProgramPreview from '@/components/mini-mastery-program/Programpreview'
import { useParams } from 'next/navigation'
import React from 'react'

function Page() {

  const params = useParams();
  const programId = params?.id as string;

  return (
    <div>
      <ProgramPreview programId={programId} />
    </div>
  )
}

export default Page