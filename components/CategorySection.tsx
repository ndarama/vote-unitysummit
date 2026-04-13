'use client';

import React from 'react';
import { Category, Nominee } from '../types';
import NomineeCard from './NomineeCard';

interface CategorySectionProps {
  category: Category;
  nominees: Nominee[];
  onSelect: (nominee: Nominee, mode: 'stats' | 'vote') => void;
  userVote?: string; // ID of the nominee the user voted for in this category
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  nominees,
  onSelect,
  userVote,
}) => {
  return (
    <div className="border-b border-gray-100 last:border-0 pb-12 last:pb-0">
      <h2 className="text-3xl font-serif font-bold text-unity-blue mb-2">{category.title}</h2>
      {category.description && (
        <p className="text-gray-500 mb-8">{category.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {nominees.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-10">
            Ingen nominerte funnet i denne kategorien.
          </p>
        ) : (
          nominees.map((nominee) => (
            <NomineeCard
              key={nominee.id}
              nominee={nominee}
              onSelect={onSelect}
              isVoted={userVote === nominee.id}
              hasVotedInCategory={!!userVote}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategorySection;
