'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Nominee } from '../types';
import { X, CheckCircle, Share2, Mail } from 'lucide-react';
import SafeImage from './SafeImage';

interface VoteModalProps {
  nominee: Nominee;
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

const VoteModal: React.FC<VoteModalProps> = ({ nominee, onClose, onSuccess, mode }) => {
  const [email, setEmail] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<NomineeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch real stats when modal opens in stats/preview mode
  useEffect(() => {
    if (mode === 'stats' || mode === 'preview') {
      setLoadingStats(true);
      fetch(`/api/nominees/${nominee.id}/stats`)
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch((err) => {
          console.error('Error fetching stats:', err);
          setLoadingStats(false);
        });
    }
  }, [mode, nominee.id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Stem på ${nominee.name}`,
          text: `Jeg har stemt på ${nominee.name} i Unity Awards 2026!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lenke kopiert til utklippstavlen!');
    }
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acknowledged) {
      setError('Vennligst bekreft at du forstår at du kun kan stemme én gang per kategori');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          categoryId: nominee.categoryId, 
          nomineeId: nominee.id 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Call onSuccess after a delay to update parent state
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(data.error || 'Noe gikk galt');
      }
    } catch (err: any) {
      setError(err.message || 'Kunne ikke koble til serveren');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'vote') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X size={24} />
          </button>

          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-unity-blue mb-4">
                Takk for din stemme!
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Din stemme på <strong className="text-unity-orange">{nominee.name}</strong> er registrert.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✓ Stemme bekreftet og lagret i databasen<br />
                  📧 Bekreftelse sendt til {email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-unity-blue text-white font-bold rounded-xl hover:bg-unity-orange transition-colors shadow-lg"
              >
                Lukk
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-unity-blue mb-6 pr-8">
                Gi din stemme til <span className="text-unity-orange">{nominee.name}</span>
              </h3>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
                  {error}
                </div>
              )}

          <form onSubmit={handleSubmitVote} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                E-post adresse
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all"
                  placeholder="din@epost.no"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 text-unity-blue border-gray-300 rounded focus:ring-unity-orange focus:ring-2"
                />
                <label htmlFor="acknowledge" className="text-sm text-gray-700 cursor-pointer">
                  Jeg forstår at jeg kun kan avgi <strong>én stemme per kategori</strong>. 
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !acknowledged}
              className="w-full py-3 bg-unity-blue text-white font-bold rounded-xl hover:bg-unity-orange transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sender stemme...'
              ) : (
                <>
                  Send stemme <CheckCircle size={20} />
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh] md:h-[650px]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 z-10 text-gray-400 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur md:bg-transparent rounded-full p-2 md:p-0 shadow-sm md:shadow-none"
        >
          <X size={24} className="md:w-8 md:h-8" />
        </button>

        <button
          onClick={handleShare}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-10 text-gray-400 hover:text-unity-blue transition-colors bg-white/80 backdrop-blur md:bg-transparent rounded-full p-2 md:p-0 shadow-sm md:shadow-none"
          title="Del"
        >
          <Share2 size={24} className="md:w-8 md:h-8" />
        </button>

        {/* Nominee Details Side (Image) */}
        <div className="w-full md:w-1/3 h-48 sm:h-64 md:h-full relative bg-gray-100 shrink-0">
          <SafeImage src={nominee.imageUrl} alt={nominee.name} fill unoptimized className="object-cover" />
        </div>

        {/* Content & Vote Side */}
        <div className="w-full md:w-2/3 p-6 md:p-16 flex flex-col overflow-y-auto flex-1">
          <div className="mb-6 mt-2 md:mt-4">
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-unity-blue mb-2 md:mb-6 leading-tight tracking-tight">
              {nominee.name}
            </h3>
            {nominee.title && (
              <p className="text-unity-orange font-medium uppercase tracking-widest text-xs md:text-sm mb-4 md:mb-8">
                {nominee.title}
              </p>
            )}
            <div className="prose prose-sm md:prose-lg text-gray-500 leading-relaxed max-w-none">
              <p>{nominee.description}</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
            {mode !== 'preview' && (
              <div>
                <h4 className="text-sm font-bold text-unity-blue mb-2">Stemmeresultater</h4>
                {loadingStats ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Laster statistikk...</div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Andel stemmer
                      </p>
                      <p className="text-lg font-bold text-unity-blue">{stats.percentage}%</p>
                      <p className="text-[9px] text-gray-400 mt-1">{stats.votes}/{stats.totalVotes}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Rangering
                      </p>
                      <p className="text-lg font-bold text-unity-orange">#{stats.rank}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">Ingen data tilgjengelig</div>
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
