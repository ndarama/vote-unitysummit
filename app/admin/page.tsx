import { Suspense } from 'react';

import VoteApp from '@/components/VoteApp';

export default function AdminPage() {
  return (
    <Suspense>
      <VoteApp isAdmin={true} />
    </Suspense>
  );
}
