'use client';

import React from 'react';
import { Nominee } from '../types';
import { Check, Share2 } from 'lucide-react';
import SafeImage from './SafeImage';
import { toSlug } from '@/lib/slug';

interface NomineeCardProps {
  nominee: Nominee;
  categorySlug?: string;
  categoryTitle?: string;
  onSelect: (nominee: Nominee, mode: 'stats' | 'vote') => void;
  isVoted: boolean;
  hasVotedInCategory: boolean;
}

const NomineeCard: React.FC<NomineeCardProps> = ({
  nominee,
  categorySlug,
  categoryTitle,
  onSelect,
  isVoted,
  hasVotedInCategory,
}) => {
  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const categoryPath = categorySlug ?? (categoryTitle ? toSlug(categoryTitle) : '');
    const deltagerSlug = nominee.slug ?? toSlug(nominee.name);
    const url = categoryPath
      ? `${window.location.origin}/category/${encodeURIComponent(
          categoryPath
        )}?deltager=${encodeURIComponent(deltagerSlug)}`
      : window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Stem på ${nominee.name}`,
          text: `Se deltageren ${nominee.name} i Unity Awards 2026.`,
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
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error sharing deltager:', err);
    }
  };

  return (
    <div
      onClick={() => onSelect(nominee, 'stats')}
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer ${isVoted ? 'border-unity-orange ring-2 ring-unity-orange shadow-lg' : 'border-gray-100 hover:shadow-md'} ${hasVotedInCategory && !isVoted ? 'opacity-70' : ''}`}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <SafeImage
          src={nominee.imageUrl}
          alt={nominee.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 hover:scale-105"
          style={nominee.imageFocalPoint ? { objectPosition: nominee.imageFocalPoint } : undefined}
        />
        {isVoted && (
          <div className="absolute inset-0 bg-unity-orange/20 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white text-unity-orange px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
              <Check size={20} /> Din stemme
            </div>
          </div>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between">
        <h4 className="text-lg font-bold text-unity-blue mb-4 text-center">{nominee.name}</h4>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(nominee, 'vote');
            }}
            disabled={hasVotedInCategory}
            className={`py-2 rounded-xl font-bold text-sm transition-colors ${
              isVoted
                ? 'bg-green-100 text-green-700 cursor-default'
                : hasVotedInCategory
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-unity-blue text-white hover:bg-unity-orange'
            }`}
          >
            {isVoted
              ? 'Stemme registrert'
              : hasVotedInCategory
                ? 'Allerede stemt'
                : 'Gi din stemme'}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={`Del ${nominee.name}`}
            title="Del deltager"
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-unity-blue transition-colors hover:border-unity-orange hover:text-unity-orange"
          >
            <Share2 size={16} />
            <span className="hidden lg:inline">Del</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NomineeCard;
