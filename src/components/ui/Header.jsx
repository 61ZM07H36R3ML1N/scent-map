import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Loader2,
  Sparkles,
  X,
  Plus,
  LogIn,
  LogOut,
  Bookmark,
  Dna,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const GENDER_OPTIONS = [
  { id: null, label: 'All' },
  { id: 'masculine', label: 'Men' },
  { id: 'unisex', label: 'Unisex' },
  { id: 'feminine', label: 'Women' },
];

export default function Header({
  activeFragrance,
  onSelectFragrance,
  genderFilter,
  onGenderFilterChange,
  isShelfActive,
  onToggleShelf,
  shelfCount = 0,
  onOpenAuth,
  onOpenAddModal,
  onOpenDna, // <-- Trigger for Olfactive DNA Modal
}) {
  const { user, profile, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced search query against Supabase catalog
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('fragrances')
        .select('*')
        .or(`name.ilike.%${query}%,house.ilike.%${query}%`)
        .limit(8);

      if (!error && data) setResults(data);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 bg-[#8ed1fc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-[#70b9e8]">
      {/* Brand & Subtitle */}
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Scent-Map</h1>
        <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-wider text-zinc-700/80">
          Olfactive Network
        </span>
      </div>

      {/* Filter Tabs + My Shelf + Olfactive DNA Button */}
      <div className="flex items-center gap-1 bg-white/40 p-1 rounded-lg backdrop-blur-xs border border-white/60">
        {GENDER_OPTIONS.map((opt) => (
          <button
            key={String(opt.id)}
            disabled={isShelfActive}
            onClick={() => onGenderFilterChange(opt.id)}
            className={`px-2 py-0.5 text-xs font-mono rounded transition cursor-pointer disabled:opacity-40 ${
              !isShelfActive && genderFilter === opt.id
                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                : 'text-zinc-700 hover:text-black hover:bg-white/50'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

        {/* My Shelf Filter Button */}
        <button
          onClick={() => {
            if (!user) onOpenAuth();
            else onToggleShelf();
          }}
          className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded transition cursor-pointer ${
            isShelfActive
              ? 'bg-rose-600 text-white font-bold shadow-xs'
              : 'text-zinc-700 hover:text-rose-600 hover:bg-white/50'
          }`}
          title={user ? 'Filter map to My Shelf' : 'Log in to view My Shelf'}
        >
          <Bookmark className={`w-3 h-3 ${isShelfActive ? 'fill-white' : ''}`} />
          <span>Shelf</span>
          {shelfCount > 0 && (
            <span
              className={`text-[9px] px-1 rounded-full ${
                isShelfActive ? 'bg-rose-800 text-white' : 'bg-zinc-200 text-zinc-800'
              }`}
            >
              {shelfCount}
            </span>
          )}
        </button>

        {/* Olfactive DNA Signature Modal Trigger */}
        <button
          onClick={() => {
            if (!user) onOpenAuth();
            else onOpenDna();
          }}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded text-indigo-700 hover:text-indigo-950 hover:bg-indigo-50/70 transition cursor-pointer"
          title="Inspect your personalized Olfactive DNA profile"
        >
          <Dna className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold hidden sm:inline">DNA</span>
        </button>
      </div>

      {/* Right Controls: Search, Add Bottle & User Menu */}
      <div className="flex items-center gap-2">
        {/* Autocomplete Search */}
        <div className="relative w-48 sm:w-64" ref={dropdownRef}>
          <div className="relative flex items-center bg-white rounded border border-[#70b9e8] focus-within:border-zinc-800 transition shadow-xs">
            <Search className="w-3.5 h-3.5 ml-2.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search scent..."
              className="w-full bg-transparent px-2 py-1 text-xs text-zinc-900 placeholder-zinc-400 outline-none"
            />
            {isSearching && (
              <Loader2 className="w-3 h-3 mr-2 text-zinc-400 animate-spin shrink-0" />
            )}
            {query && !isSearching && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="mr-2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isOpen && query.trim().length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden z-40 max-h-64 overflow-y-auto">
              {results.length === 0 && !isSearching ? (
                <div className="p-3 text-xs text-zinc-500 text-center font-mono">
                  No bottles found.
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectFragrance(item);
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex items-center justify-between group transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 group-hover:text-blue-600">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">{item.house}</div>
                    </div>
                    <Sparkles className="w-3 h-3 text-zinc-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Scent Button */}
        <button
          onClick={() => {
            if (!user) onOpenAuth();
            else onOpenAddModal();
          }}
          className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded border border-[#70b9e8] shadow-xs transition cursor-pointer"
          title="Submit a new fragrance"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>

        {/* Auth State Button */}
        {user ? (
          <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded border border-white">
            <span className="text-xs font-mono font-bold text-zinc-800 max-w-[100px] truncate">
              {profile?.username || user.email?.split('@')[0]}
            </span>
            <button
              onClick={signOut}
              title="Sign Out"
              className="text-zinc-500 hover:text-black p-0.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-black text-white text-xs font-semibold px-2.5 py-1.5 rounded shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}