'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

    const result = await signIn('admin', { username, password, redirect: false });

    setLoading(false);

    if (result?.ok) {
      router.push('/admin');
    } else {
      setError('Feil brukernavn eller passord');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-unity-blue flex items-center justify-center mb-4">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Logg inn</h1>
          <p className="text-gray-500 text-sm mt-1">Admin-tilgang</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Brukernavn
            </label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-unity-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Passord
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-unity-blue"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-unity-blue text-white py-2.5 rounded-lg font-bold uppercase tracking-wider hover:bg-unity-orange transition-colors disabled:opacity-60"
          >
            {loading ? 'Logger inn…' : 'Logg inn'}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              Glemt passord?
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
            ← Tilbake til forsiden
          </Link>
        </div>
      </div>
    </main>
  );
}
