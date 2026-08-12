import { Suspense } from 'react';

import VoteApp from '@/components/VoteApp';

export default function CategoryPage() {
  return (
    <Suspense>
      <VoteApp />
    </Suspense>
  );
}
