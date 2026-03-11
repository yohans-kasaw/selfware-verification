import { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import type { RatingCriteria } from '../../types';

interface CriteriaRatingProps {
  initialRatings?: RatingCriteria;
  onRate: (ratings: RatingCriteria) => void;
  disabled?: boolean;
}

export function CriteriaRating({ initialRatings, onRate, disabled = false }: CriteriaRatingProps) {
  const [ratings, setRatings] = useState<RatingCriteria>(
    initialRatings || {
      clarity: 0,
      enjoyment: 0,
      vibes: 0,
    }
  );

  const handleRate = (key: keyof RatingCriteria, value: number) => {
    const newRatings = { ...ratings, [key]: value };
    setRatings(newRatings);
    onRate(newRatings);
  };

  const criteriaList = [
    { key: 'vibes' as const, label: 'Vibes' },
    { key: 'clarity' as const, label: 'Clarity' },
    { key: 'enjoyment' as const, label: 'Enjoyment' },
  ];

  // Update internal state if props change (e.g. moving between cards)
  useEffect(() => {
    if (initialRatings) {
      setRatings(initialRatings);
    } else {
      setRatings({ clarity: 0, enjoyment: 0, vibes: 0 });
    }
  }, [initialRatings]);

  return (
    <div className="flex flex-col gap-4">
      {criteriaList.map(({ key, label }) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">{label}</span>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <StarRating
              rating={ratings[key]}
              onRate={(val) => handleRate(key, val)}
              disabled={disabled}
            />
          </div>
        </div>
      ))}
    </div>
  );
}