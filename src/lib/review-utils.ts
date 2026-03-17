/**
 * Strip HTML tags and trim whitespace from user input.
 */
export function sanitizeComment(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate that a rating is an integer between 1 and 5.
 */
export function validateRating(rating: unknown): rating is number {
  return (
    typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

/**
 * Generate a partial/anonymous display name.
 * "Juan Martinez" → "J. M."
 * "Ana" → "A."
 * null/empty → "Anon."
 */
export function getPartialName(displayName: string | null | undefined): string {
  if (!displayName || !displayName.trim()) return "Anon.";

  const parts = displayName.trim().split(/\s+/);
  return parts
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}
