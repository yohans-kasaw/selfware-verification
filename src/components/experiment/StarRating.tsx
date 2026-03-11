import { useState } from 'react';
import { StarIcon } from '../Icons';

interface StarRatingProps {
  maxStars?: number;
  rating?: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ maxStars = 5, rating = 0, onRate, disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-colors
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-100'}
              ${starValue <= (hover || rating) ? 'text-amber-400' : 'text-slate-300'}
            `}
            onClick={() => {
              if (!disabled) {
                onRate(starValue);
              }
            }}
            onMouseEnter={() => !disabled && setHover(starValue)}
            onMouseLeave={() => !disabled && setHover(0)}
            disabled={disabled}
          >
            <StarIcon className="w-6 h-6" filled={starValue <= (hover || rating)} />
          </button>
        );
      })}
    </div>
  );
}
