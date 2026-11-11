import React from 'react';

/**
 * Highlights pitfall keywords in analysis text.
 */
export function renderHighlightedText(text: string, keywords: string[] = []): React.ReactNode {
  if (!text) return null;
  if (!keywords || keywords.length === 0) {
    return <span>{text}</span>;
  }

  // Filter valid non-empty keywords and escape regex characters
  const validKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .sort((a, b) => b.length - a.length); // match longest first

  if (validKeywords.length === 0) {
    return <span>{text}</span>;
  }

  const escaped = validKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = validKeywords.some((k) => k.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-amber-100 text-amber-900 font-semibold px-1 py-0.5 rounded border border-amber-300 mx-0.5 underline decoration-amber-500 decoration-wavy decoration-1 inline-block"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
