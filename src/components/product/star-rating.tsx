"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const INTERACTIVE_SIZES = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = "md",
  ariaLabel,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered || rating;
  const iconSize = interactive ? INTERACTIVE_SIZES[size] : SIZES[size];

  if (interactive) {
    return (
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={ariaLabel}
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const value = i + 1;
          const filled = value <= displayRating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              onMouseEnter={() => setHovered(value)}
              className="cursor-pointer rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-highlight/50"
              role="radio"
              aria-checked={value === rating}
              aria-label={`${value} star${value !== 1 ? "s" : ""}`}
            >
              <Star
                className={`${iconSize} transition-colors ${
                  filled
                    ? "fill-warning text-warning"
                    : "fill-none text-muted/40"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5" aria-label={ariaLabel} role="img">
      {Array.from({ length: maxStars }, (_, i) => {
        const value = i + 1;
        const filled = value <= Math.round(displayRating);
        return (
          <Star
            key={value}
            className={`${iconSize} ${
              filled
                ? "fill-warning text-warning"
                : "fill-none text-muted/40"
            }`}
          />
        );
      })}
    </div>
  );
}
