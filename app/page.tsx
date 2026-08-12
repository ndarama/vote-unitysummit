import { Suspense } from 'react';

import VoteApp from '@/components/VoteApp';

export default function HomePage() {
  return (
    <Suspense>
      <VoteApp />
    </Suspense>
  );
}
