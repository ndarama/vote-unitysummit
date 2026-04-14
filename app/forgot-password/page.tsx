'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Noe gikk galt. Prøv igjen.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-unity-blue flex items-center justify-center mb-4">
            <Mail size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Glemt passord?</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm">
                Dersom e-postadressen er registrert, vil du motta en e-post med instruksjoner
                for å tilbakestille passordet ditt.
              </p>
            </div>
            <Link
              href="/login"
              className="text-unity-blue text-sm font-medium hover:underline"
            >
              ← Tilbake til innlogging
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                E-postadresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-unity-blue"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-unity-blue text-white py-2.5 rounded-lg font-bold uppercase tracking-wider hover:bg-unity-orange transition-colors disabled:opacity-60"
            >
              {loading ? 'Sender…' : 'Send tilbakestillings-e-post'}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
                ← Tilbake til innlogging
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
