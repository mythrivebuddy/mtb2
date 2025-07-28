import { Suspense } from 'react';
import LetOthersRollClient from './LetOthersRollClient';

export default function LetOthersRollPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading page...</div>}>
      <LetOthersRollClient />
    </Suspense>
  );
}