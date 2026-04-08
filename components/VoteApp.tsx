'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, Nominee } from '../types';
import CategorySection from './CategorySection';
import VoteModal from './VoteModal';
import AdminDashboard from './AdminDashboard';
import { Lock, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Countdown from './Countdown';

interface VoteAppProps {
  isAdmin?: boolean;
}

const VoteApp: React.FC<VoteAppProps> = ({ isAdmin }) => {
  const params = useParams<{ categoryId?: string }>();
  const categoryId = params?.categoryId;
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [modalMode, setModalMode] = useState<'stats' | 'vote'>('stats');
  const [userVotes, setUserVotes] = useState<any[]>([]); // { categoryId, nomineeId }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Fetched data:', data);
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('Invalid data format: categories missing or not an array');
        }
        setCategories(data.categories);
        setNominees(data.nominees || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      });

    fetch('/api/user/votes')
      .then((res) => res.json())
      .then((data) => setUserVotes(data))
      .catch((err) => console.error('Error fetching votes:', err));
  }, []);

  const handleVoteClick = (nominee: Nominee, mode: 'stats' | 'vote' = 'vote') => {
    if (mode === 'vote') {
      const hasVoted = userVotes.some((v) => v.categoryId === nominee.categoryId);
      if (hasVoted) {
        alert('Du har allerede stemt i denne kategorien.');
        return;
      }
    }
    setModalMode(mode);
    setSelectedNominee(nominee);
  };

  const handleVoteSuccess = (nomineeId: string, categoryId: string) => {
    setUserVotes([...userVotes, { categoryId, nomineeId }]);
    setSelectedNominee(null);
    alert('Takk! Din stemme er registrert.');
  };

  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Filter categories if a specific one is selected
  const displayedCategories = categoryId
    ? categories.filter((c) => c.id === categoryId)
    : categories;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero / Header */}
      <div className="relative text-white py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://ik.imgkit.net/3vlqs5axxjf/external/http://images.ntmllc.com/v4/conv-center/580/5802628/5802628_EXT_Grieghallen-Bergen_Z12AE2.jpg?tr=w-1200%2Cfo-auto"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-unity-blue/85"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Unity Awards 2026</h1>
          <p className="text-xl md:text-2xl text-unity-orange font-light">
            Din stemme teller. Vær med å kåre årets vinnere.
          </p>
          <div className="mt-8">
            <Countdown />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-0">
          {loading && <div className="text-center py-10">Laster inn kategorier...</div>}
          {error && (
            <div className="text-center py-10 text-red-500">Feil ved lasting av data: {error}</div>
          )}

          {!loading && !error && (
            <>
              {categoryId ? (
                // Detail View: Show specific category and nominees
                <div>
                  <Link
                    href="/"
                    className="inline-flex items-center text-gray-500 hover:text-unity-orange mb-6 font-medium transition-colors"
                  >
                    <ArrowLeft size={20} className="mr-2" /> Tilbake til oversikt
                  </Link>
                  {displayedCategories.map((category) => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      nominees={nominees.filter((n) => n.categoryId === category.id)}
                      onSelect={handleVoteClick}
                      userVote={userVotes.find((v) => v.categoryId === category.id)?.nomineeId}
                    />
                  ))}
                </div>
              ) : (
                // Home View: Show grid of categories
                <div>
                  <h2 className="text-2xl font-bold text-unity-blue mb-8 text-center">
                    Velg en kategori for å stemme
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {categories.map((category) => {
                      const hasVoted = userVotes.some((v) => v.categoryId === category.id);
                      const categoryNominees = nominees.filter((n) => n.categoryId === category.id);

                      return (
                        <div
                          key={category.id}
                          onClick={() => router.push(`/category/${category.id}`)}
                          className={`block rounded-2xl border transition-all duration-300 group hover:shadow-xl overflow-hidden flex flex-col h-full cursor-pointer ${
                            hasVoted
                              ? 'bg-green-50 border-green-200 hover:border-green-300'
                              : 'bg-white border-gray-100 hover:border-unity-orange'
                          }`}
                        >
                          <div className="h-48 overflow-hidden relative">
                            <img
                              src={category.imageUrl}
                              alt={category.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              style={category.imageFocalPoint ? { objectPosition: category.imageFocalPoint } : undefined}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-4 left-6 text-white">
                              <p className="text-sm font-medium uppercase tracking-wider opacity-90">
                                {categoryNominees.length} nominerte
                              </p>
                            </div>
                          </div>

                          <div className="p-8 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-2xl font-bold text-unity-blue group-hover:text-unity-orange transition-colors font-serif">
                                {category.title}
                              </h3>
                            </div>
                            <p className="text-gray-600 mb-6 line-clamp-3 flex-grow">
                              {category.description}
                            </p>

                            <div className="mt-auto">
                              {hasVoted ? (
                                <span className="inline-flex items-center text-green-600 font-bold text-sm uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full">
                                  <CheckCircle size={16} className="mr-2" /> Stemme registrert
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-unity-orange font-bold text-sm uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                  Se nominerte <ChevronRight size={16} className="ml-1" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Purchase Ticket Card */}
                    <div className="block rounded-2xl border border-gray-100 bg-[#001f2b] text-white transition-all duration-300 hover:shadow-xl overflow-hidden flex flex-col h-full">
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-unity-orange flex items-center justify-center shrink-0">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M13 5V19M5 5H19C20.1046 5 21 5.89543 21 7V10C19.8954 10 19 10.8954 19 12C19 13.1046 19.8954 14 21 14V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V14C4.10457 14 5 13.1046 5 12C5 10.8954 4.10457 10 3 10V7C3 5.89543 3.89543 5 5 5Z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold font-serif">Kjøp billett</h3>
                            <p className="text-gray-400 text-sm">Bli med på den store seremonien</p>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-8 leading-relaxed flex-grow">
                          Gå ikke glipp av årets mest inspirerende begivenhet. Sikre deg plass på
                          Unity Summit & Awards 2026 i dag. Opplev feiringen av lederskap og
                          fellesskap på nært hold.
                        </p>

                        <div className="mt-auto">
                          <a
                            href="#"
                            className="inline-block w-full py-3 bg-white text-[#001f2b] font-bold text-center rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            Kjøp billetter
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedNominee && (
        <VoteModal
          nominee={selectedNominee}
          onClose={() => setSelectedNominee(null)}
          onSuccess={() => handleVoteSuccess(selectedNominee.id, selectedNominee.categoryId)}
          mode={modalMode}
        />
      )}

    </div>
  );
};

export default VoteApp;
