'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn.');
      return;
    }
    if (password !== confirm) {
      setError('Passordene stemmer ikke overens.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Noe gikk galt. Prøv igjen.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 text-sm mb-4">Ugyldig eller manglende token.</p>
        <Link href="/forgot-password" className="text-unity-blue text-sm font-medium hover:underline">
          Be om ny tilbakestillings-e-post
        </Link>
      </div>
    );
  }

  return (
    <>
      {success ? (
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              Passordet ditt er oppdatert! Du blir sendt til innloggingssiden…
            </p>
          </div>
          <Link href="/login" className="text-unity-blue text-sm font-medium hover:underline">
            Logg inn
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nytt passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-unity-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Bekreft nytt passord
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-unity-blue"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-unity-blue text-white py-2.5 rounded-lg font-bold uppercase tracking-wider hover:bg-unity-orange transition-colors disabled:opacity-60"
          >
            {loading ? 'Oppdaterer…' : 'Sett nytt passord'}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
              ← Tilbake til innlogging
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-unity-blue flex items-center justify-center mb-4">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nytt passord</h1>
          <p className="text-gray-500 text-sm mt-1">Velg et nytt passord for din konto</p>
        </div>
        <Suspense fallback={<p className="text-center text-gray-400 text-sm">Laster…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
