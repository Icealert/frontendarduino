import { Suspense } from 'react';
import ClientDashboard from '@/components/ClientDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <Suspense fallback={<div>Loading...</div>}>
        <ClientDashboard />
      </Suspense>
    </main>
  );
} 