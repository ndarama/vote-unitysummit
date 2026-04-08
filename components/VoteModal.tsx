'use client';

import React, { useState } from 'react';
import { Nominee } from '../types';
import { X, Mail, Lock, CheckCircle, Share2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface VoteModalProps {
  nominee: Nominee;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'stats' | 'vote' | 'preview';
}

const VoteModal: React.FC<VoteModalProps> = ({ nominee, onClose, onSuccess, mode }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock stats (random for demo)
  const votePercentage = Math.floor(Math.random() * 40) + 10; // 10-50%
  const rank = Math.floor(Math.random() * 3) + 1; // 1-3

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep('otp');
      } else {
        const data = await res.json();
        setError(data.error || 'Noe gikk galt');
      }
    } catch (err) {
      setError('Kunne ikke koble til serveren');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verify OTP via Auth.js credentials
      const result = await signIn('otp', {
        email,
        code: otp,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error('Ugyldig eller utløpt kode');
      }

      // 2. Cast Vote
      const voteRes = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: nominee.categoryId, nomineeId: nominee.id }),
      });

      if (voteRes.ok) {
        onSuccess();
      } else {
        const data = await voteRes.json();
        throw new Error(data.error || 'Kunne ikke registrere stemme');
      }
    } catch (err: any) {
      setError(err.message);
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

          <h3 className="text-2xl font-bold text-unity-blue mb-6 pr-8">
            Gi din stemme til <span className="text-unity-orange">{nominee.name}</span>
          </h3>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
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
                <p className="text-xs text-gray-400 mt-2">
                  Vi sender deg en engangskode for å verifisere stemmen din.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-unity-blue text-white font-bold rounded-xl hover:bg-unity-orange transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? 'Sender...' : 'Send kode'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndVote} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Engangskode
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all tracking-widest text-lg"
                    placeholder="123456"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Sjekk innboksen til {email}.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-unity-blue text-white font-bold rounded-xl hover:bg-unity-orange transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Bekrefter...'
                ) : (
                  <>
                    Bekreft og stem <CheckCircle size={20} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-2 text-gray-500 text-sm hover:text-unity-blue"
              >
                Endre e-post
              </button>
            </form>
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
          <img src={nominee.imageUrl} alt={nominee.name} className="w-full h-full object-cover" />
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Andel stemmer
                    </p>
                    <p className="text-lg font-bold text-unity-blue">{votePercentage}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Rangering
                    </p>
                    <p className="text-lg font-bold text-unity-orange">#{rank}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
