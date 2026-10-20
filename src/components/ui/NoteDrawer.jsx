import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Sparkles, Heart, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCompatibilityScore } from '../../utils/olfactiveDna';

export default function NoteDrawer({
  fragrance,
  isFavorite,
  onToggleFavorite,
  onOpenAuth,
  onHoverNote,
  favoriteBottles = [], // User's saved collection
}) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute blind-buy compatibility against user's shelf
  const matchScore = useMemo(() => {
    if (!fragrance || favoriteBottles.length === 0) return null;
    return getCompatibilityScore(fragrance, favoriteBottles);
  }, [fragrance, favoriteBottles]);

  if (!fragrance) return null;

  return (
    <aside className="absolute bottom-5 left-5 z-20 max-w-sm bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-xl p-3.5 sm:p-4 shadow-lg transition-all font-sans">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 leading-tight">
            {fragrance.name}
          </h2>
          <p className="text-[11px] font-mono text-zinc-500 uppercase">
            {fragrance.house}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (!user) onOpenAuth();
              else onToggleFavorite(fragrance);
            }}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-rose-500'
            }`}
            title={isFavorite ? 'Remove from My Shelf' : 'Save to My Shelf'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Blind-Buy Match Badge */}
      {matchScore !== null && (
        <div className="my-2 py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-[11px]">
          <span className="font-mono text-emerald-800 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            Wardrobe Compatibility
          </span>
          <span className="font-mono font-bold text-emerald-700">
            {matchScore}% Match
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-zinc-100 space-y-2">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Scent Notes (Hover to resonate)
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {(fragrance.notes || []).map((note) => (
              <button
                key={note}
                onMouseEnter={() => onHoverNote?.(note)}
                onMouseLeave={() => onHoverNote?.(null)}
                className="text-[10px] bg-zinc-50 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-900 border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}