import React, { useState, useMemo } from 'react';
import OlfactiveDnaModal from './components/profile/OlfactiveDnaModal';
import { useFragranceGraph } from './hooks/useFragranceGraph';
import { useFavorites } from './hooks/useFavorites';
import Header from './components/ui/Header';
import ScentCanvas from './components/map/ScentCanvas';
import NoteDrawer from './components/ui/NoteDrawer';
import CommunityFeedDrawer from './components/ui/CommunityFeedDrawer';
import AuthModal from './components/auth/AuthModal';
import AddFragranceModal from './components/map/AddFragranceModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const {
    activeFragrance,
    neighbors,
    loading,
    genderFilter,
    setGenderFilter,
    focusFragrance,
  } = useFragranceGraph();

  const { favoriteIds, favoriteBottles, toggleFavorite } = useFavorites();
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [isShelfActive, setIsShelfActive] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dnaModalOpen, setDnaModalOpen] = useState(false);
  const [communityDrawerOpen, setCommunityDrawerOpen] = useState(false);

  const visibleNeighbors = useMemo(() => {
    if (!isShelfActive) return neighbors;
    return neighbors.filter((n) => favoriteIds.has(n.id));
  }, [neighbors, isShelfActive, favoriteIds]);

  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden flex flex-col font-sans">
      <Header
        activeFragrance={activeFragrance}
        onSelectFragrance={focusFragrance}
        genderFilter={genderFilter}
        onGenderFilterChange={setGenderFilter}
        isShelfActive={isShelfActive}
        onToggleShelf={() => setIsShelfActive(!isShelfActive)}
        shelfCount={favoriteIds.size}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAddModal={() => setAddModalOpen(true)}
        onOpenDna={() => setDnaModalOpen(true)}
      />

      <main className="relative flex-1 w-full h-full pt-12">
        {loading && !activeFragrance ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#70b9e8]" />
            <span className="text-xs font-mono uppercase tracking-widest">
              Synthesizing Olfactive Matrix...
            </span>
          </div>
        ) : (
          <>
            <ScentCanvas
              activeFragrance={activeFragrance}
              neighbors={visibleNeighbors}
              onSelectNode={focusFragrance}
              highlightedNote={highlightedNote}
            />
            <NoteDrawer
              fragrance={activeFragrance}
              isFavorite={activeFragrance ? favoriteIds.has(activeFragrance.id) : false}
              onToggleFavorite={toggleFavorite}
              onOpenAuth={() => setAuthModalOpen(true)}
              onHoverNote={setHighlightedNote}
              favoriteBottles={favoriteBottles}
            />
            {activeFragrance && (
              <CommunityFeedDrawer
                fragrance={activeFragrance}
                isOpen={communityDrawerOpen}
                onClose={() => setCommunityDrawerOpen(false)}
                onOpenAuth={() => setAuthModalOpen(true)}
  />
)}
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AddFragranceModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={(newFragrance) => focusFragrance(newFragrance)}
      />
      <OlfactiveDnaModal
        isOpen={dnaModalOpen}
        onClose={() => setDnaModalOpen(false)}
        bottles={favoriteBottles}
      />
    </div>
  );
}