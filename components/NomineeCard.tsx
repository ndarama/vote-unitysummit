'use client';

import React from 'react';
import { Nominee } from '../types';
import { Check } from 'lucide-react';
import SafeImage from './SafeImage';

interface NomineeCardProps {
  nominee: Nominee;
  onSelect: (nominee: Nominee, mode: 'stats' | 'vote') => void;
  isVoted: boolean;
  hasVotedInCategory: boolean;
}

const NomineeCard: React.FC<NomineeCardProps> = ({
  nominee,
  onSelect,
  isVoted,
  hasVotedInCategory,
}) => {
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
          unoptimized
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(nominee, 'vote');
          }}
          disabled={hasVotedInCategory}
          className={`w-full py-2 rounded-xl font-bold text-sm transition-colors ${
            isVoted
              ? 'bg-green-100 text-green-700 cursor-default'
              : hasVotedInCategory
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-unity-blue text-white hover:bg-unity-orange'
          }`}
        >
          {isVoted ? 'Stemme registrert' : hasVotedInCategory ? 'Allerede stemt' : 'Gi din stemme'}
        </button>
      </div>
    </div>
  );
};

export default NomineeCard;
