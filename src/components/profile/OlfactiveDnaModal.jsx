import React, { useMemo } from 'react';
import { X, Dna, Sparkles, Award, Bookmark } from 'lucide-react';
import { analyzeWardrobe } from '../../utils/olfactiveDna';

export default function OlfactiveDnaModal({ isOpen, onClose, bottles = [] }) {
  const dna = useMemo(() => analyzeWardrobe(bottles), [bottles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 leading-tight">
              Olfactive DNA Profile
            </h2>
            <p className="text-[11px] font-mono text-zinc-400 uppercase">
              Derived from {dna.totalBottles} Wardrobe {dna.totalBottles === 1 ? 'Bottle' : 'Bottles'}
            </p>
          </div>
        </div>

        {dna.totalBottles === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Bookmark className="w-8 h-8 mx-auto text-zinc-300 stroke-[1.5]" />
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Your shelf is empty. Heart at least 2 bottles on the map to unlock your personalized scent archetype and blind-buy metrics.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Archetype Hero Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-zinc-900 to-black rounded-xl p-4 text-white shadow-md border border-zinc-800">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-indigo-400 mb-1">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Scent Archetype
                </span>
                <span>Active Signature</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mb-1">
                {dna.archetype}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-light">
                {dna.description}
              </p>
            </div>

            {/* Dominant Accords Breakdown */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Primary Olfactive Accords
              </div>
              <div className="space-y-2">
                {dna.dominantAccords.map((item) => (
                  <div key={item.accord}>
                    <div className="flex justify-between text-xs font-semibold text-zinc-800 mb-1">
                      <span>{item.accord}</span>
                      <span className="font-mono text-zinc-500 text-[11px]">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Recurring Raw Materials */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Signature Raw Notes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dna.dominantNotes.map((n) => (
                  <span
                    key={n.note}
                    className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs px-2.5 py-1 rounded-lg"
                  >
                    <span className="font-medium">{n.note}</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1 rounded">
                      {n.percentage}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}