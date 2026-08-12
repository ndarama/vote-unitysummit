'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Mail, Share2, User, X } from 'lucide-react';

import { toSlug } from '@/lib/slug';
import { Nominee } from '../types';
import SafeImage from './SafeImage';

interface VoteModalProps {
  nominee: Nominee;
  categoryTitle?: string;
  categorySlug?: string;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'stats' | 'vote' | 'preview';
}

interface NomineeStats {
  votes: number;
  totalVotes: number;
  percentage: number;
  rank: number;
  totalNominees: number;
}

interface ApiErrorResponse {
  error?: string;
}

const VoteModal: React.FC<VoteModalProps> = ({
  nominee,
  categoryTitle,
  categorySlug,
  onClose,
  onSuccess,
  mode,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const [step, setStep] = useState<'form' | 'voted'>('form');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<NomineeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /**
   * Fetch nominee statistics when the modal is opened
   * in stats or preview mode.
   */
  useEffect(() => {
    if (mode !== 'stats' && mode !== 'preview') {
      return;
    }

    const controller = new AbortController();

    const fetchStats = async () => {
      setLoadingStats(true);

      try {
        const params = new URLSearchParams({
          deltager: nominee.slug ?? toSlug(nominee.name),
        });
        const categoryPath = categorySlug ?? (categoryTitle ? toSlug(categoryTitle) : '');

        if (categoryPath) {
          params.set('category', categoryPath);
        }

        const response = await fetch(`/api/nominees/stats?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Kunne ikke hente statistikk');
        }

        const data: NomineeStats = await response.json();

        setStats(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching stats:', err);
        setStats(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStats(false);
        }
      }
    };

    void fetchStats();

    return () => {
      controller.abort();
    };
  }, [categorySlug, categoryTitle, mode, nominee.name, nominee.slug]);

  /**
   * Share deltager/category URL.
   */
  const handleShare = async () => {
    const nomineeSlug = nominee.slug ?? toSlug(nominee.name);
    const categoryPath = categorySlug ?? (categoryTitle ? toSlug(categoryTitle) : '');

    const url = categoryPath
      ? `${window.location.origin}/category/${encodeURIComponent(
          categoryPath
        )}?deltager=${encodeURIComponent(nomineeSlug)}`
      : window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Stem på ${nominee.name}`,
          text: `Jeg har stemt på ${nominee.name} i Unity Awards 2026!`,
          url,
        });

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        window.alert('Lenke kopiert til utklippstavlen!');
        return;
      }

      window.prompt('Kopier denne lenken:', url);
    } catch (err) {
      /**
       * AbortError normally means the user closed
       * the native share dialog.
       */
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error sharing:', err);
    }
  };

  /**
   * Submit vote.
   */
  const handleVote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acknowledged) {
      setError('Vennligst bekreft at du forstår at du kun kan stemme én gang per kategori');
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail) {
      setError('Vennligst fyll inn navn og e-postadresse');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          categoryId: nominee.categoryId,
          nomineeId: nominee.id,
        }),
      });

      const data: ApiErrorResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Noe gikk galt');
        return;
      }

      setStep('voted');

      window.setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      console.error('Error submitting vote:', err);

      setError(err instanceof Error ? err.message : 'Kunne ikke koble til serveren');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Voting modal.
   */
  if (mode === 'vote') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 md:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-800"
          >
            <X size={24} />
          </button>

          {step === 'voted' ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle size={48} className="text-green-600" />
              </div>

              <h3 className="mb-4 text-3xl font-bold text-unity-blue">
                Takk{name ? `, ${name}` : ''}!
              </h3>

              <p className="mb-4 text-lg text-gray-600">
                Din stemme på <strong className="text-unity-orange">{nominee.name}</strong> er
                registrert.
              </p>

              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-800">✓ Stemme bekreftet</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-unity-blue py-3 font-bold text-white shadow-lg transition-colors hover:bg-unity-orange"
              >
                Lukk
              </button>
            </div>
          ) : (
            <>
              <h3 className="mb-6 pr-8 text-2xl font-bold text-unity-blue">
                Gi din stemme til <span className="text-unity-orange">{nominee.name}</span>
              </h3>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleVote} className="space-y-6">
                <div>
                  <label
                    htmlFor="voter-name"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700"
                  >
                    Fullt navn
                  </label>

                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="voter-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                      }}
                      placeholder="Navn Navnesen"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none transition-all focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="voter-email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700"
                  >
                    E-postadresse
                  </label>

                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="voter-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                      }}
                      placeholder="din@epost.no"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none transition-all focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="acknowledge"
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(event) => {
                        setAcknowledged(event.target.checked);

                        if (event.target.checked) {
                          setError('');
                        }
                      }}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-unity-blue focus:ring-2 focus:ring-unity-orange"
                    />

                    <label htmlFor="acknowledge" className="cursor-pointer text-sm text-gray-700">
                      Jeg forstår at jeg kun kan avgi <strong>én stemme per kategori</strong>.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !acknowledged}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-unity-blue py-3 font-bold text-white shadow-lg transition-colors hover:bg-unity-orange disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    'Sender stemme...'
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Send stemme
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  /**
   * Stats / nominee preview modal.
   */
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:p-12">
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 md:h-[650px] md:flex-row md:rounded-[2.5rem]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-400 shadow-sm backdrop-blur transition-colors hover:text-gray-800 md:right-8 md:top-8 md:bg-transparent md:p-0 md:shadow-none"
        >
          <X size={24} className="md:h-8 md:w-8" />
        </button>

        <button
          type="button"
          onClick={() => {
            void handleShare();
          }}
          aria-label={`Del ${nominee.name}`}
          title="Del deltager"
          className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-unity-blue shadow-sm backdrop-blur transition-colors hover:text-unity-orange md:left-8 md:top-8"
        >
          <Share2 size={18} />
          <span>Del deltager</span>
        </button>

        {/* Nominee image */}
        <div className="relative h-48 w-full shrink-0 bg-gray-100 sm:h-64 md:h-full md:w-1/3">
          <SafeImage
            src={nominee.imageUrl}
            alt={nominee.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>

        {/* Nominee information */}
        <div className="flex w-full flex-1 flex-col overflow-y-auto p-6 md:w-2/3 md:p-16">
          <div className="mb-6 mt-2 md:mt-4">
            {categoryTitle && (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                {categoryTitle}
              </p>
            )}

            <h3 className="mb-2 font-serif text-3xl font-bold leading-tight tracking-tight text-unity-blue sm:text-4xl md:mb-6 md:text-6xl">
              {nominee.name}
            </h3>

            {nominee.title && (
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-unity-orange md:mb-8 md:text-sm">
                {nominee.title}
              </p>
            )}

            {nominee.description && (
              <div className="prose prose-sm max-w-none leading-relaxed text-gray-500 md:prose-lg">
                <p>{nominee.description}</p>
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-gray-100 pt-4">
            {mode === 'stats' && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-unity-blue">Stemmeresultater</h4>

                {loadingStats ? (
                  <div className="py-4 text-center text-sm text-gray-400">Laster statistikk...</div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Andel stemmer
                      </p>

                      <p className="text-lg font-bold text-unity-blue">{stats.percentage}%</p>

                      <p className="mt-1 text-[9px] text-gray-400">
                        {stats.votes}/{stats.totalVotes}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Rangering
                      </p>

                      <p className="text-lg font-bold text-unity-orange">#{stats.rank}</p>

                      {stats.totalNominees > 0 && (
                        <p className="mt-1 text-[9px] text-gray-400">av {stats.totalNominees}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-gray-400">
                    Ingen data tilgjengelig
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
