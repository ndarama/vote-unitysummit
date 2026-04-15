'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SafeImage from './SafeImage';

interface LeaderboardNominee {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  categoryId: string;
  categoryTitle: string;
  votes: number;
}

interface LeaderboardCategory {
  categoryId: string;
  categoryTitle: string;
  description: string;
  nominees: LeaderboardNominee[];
  totalVotes: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return res.json();
      })
      .then((data: LeaderboardCategory[]) => {
        setLeaderboardData(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].categoryId);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
        setError('Kunne ikke laste ledertavle');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-unity-blue">
        Laster ledertavle...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  const selectedCategory = leaderboardData.find((c) => c.categoryId === selectedCategoryId);
  const categoryNominees = selectedCategory ? selectedCategory.nominees : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-unity-blue text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
          <Link
            href="/"
            className="absolute left-0 top-1/2 -translate-y-1/2 text-white/70 hover:text-white flex items-center gap-2 transition-colors hidden md:flex"
          >
            <ArrowLeft size={20} /> Tilbake
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Ledertavle</h1>
          <p className="text-xl text-unity-orange font-light">
            Se hvem som leder an i årets kåring
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 pb-6 max-w-5xl mx-auto px-4">
          {leaderboardData.map((category) => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategoryId(category.categoryId)}
              className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all shadow-sm flex items-center justify-center text-center ${
                selectedCategoryId === category.categoryId
                  ? 'bg-unity-orange text-white shadow-md ring-2 ring-unity-orange ring-offset-2'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-unity-blue'
              }`}
            >
              {category.categoryTitle}
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-900 text-white p-6 md:p-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold">
                  {selectedCategory.categoryTitle}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Totalt {selectedCategory.totalVotes} stemmer
                </p>
              </div>
              <Trophy className="text-yellow-400" size={32} />
            </div>
            <div className="p-6 md:p-8">
              {categoryNominees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Ingen stemmer registrert ennå
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryNominees.map((nominee, index) => (
                    <div
                      key={nominee.id}
                      className={`flex items-center p-4 rounded-xl transition-all ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-bold text-xl md:text-2xl mr-4 md:mr-6">
                        {index === 0 ? (
                          <Medal size={32} className="text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal size={28} className="text-gray-400" />
                        ) : index === 2 ? (
                          <Medal size={28} className="text-amber-600" />
                        ) : (
                          <span className="text-gray-400">#{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mr-4 border-2 border-white shadow-sm relative">
                        <SafeImage
                          src={nominee.imageUrl}
                          alt={nominee.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-unity-blue text-lg truncate">{nominee.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{nominee.title}</p>
                      </div>
                      <div className="flex-shrink-0 text-right ml-4">
                        <div className="text-xl md:text-2xl font-bold text-unity-blue">
                          {nominee.votes}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Stemmer</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
