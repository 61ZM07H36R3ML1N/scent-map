import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteBottles, setFavoriteBottles] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setFavoriteBottles([]);
      return;
    }

    setLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('fragrance_id, fragrances(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setFavoriteIds(new Set(data.map((f) => f.fragrance_id)));
        setFavoriteBottles(data.map((f) => f.fragrances).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load saved wardrobe:', err.message);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(fetchFavorites);
  }, [fetchFavorites]);

  const toggleFavorite = async (fragrance) => {
    if (!user || !fragrance?.id) return false;

    const id = fragrance.id;
    const isFav = favoriteIds.has(id);
    const updatedIds = new Set(favoriteIds);

    if (isFav) {
      updatedIds.delete(id);
      setFavoriteIds(updatedIds);
      setFavoriteBottles((prev) => prev.filter((b) => b.id !== id));

      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', id);
    } else {
      updatedIds.add(id);
      setFavoriteIds(updatedIds);
      setFavoriteBottles((prev) => [fragrance, ...prev]);

      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, fragrance_id: id });
    }
    return true;
  };

  return {
    favoriteIds,
    favoriteBottles,
    loadingFavorites,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
}