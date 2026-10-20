import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFragranceGraph(initialFragranceId = null) {
  const [activeFragrance, setActiveFragrance] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch initial or default fragrance on mount
  useEffect(() => {
  async function loadInitial() {
    try {
      setLoading(true);

      // Check URL parameters first: ?focus=uuid
      const params = new URLSearchParams(window.location.search);
      const urlFocusId = params.get('focus');

      let query = supabase.from('fragrances').select('*');
      if (urlFocusId) {
        query = query.eq('id', urlFocusId);
      } else if (initialFragranceId) {
        query = query.eq('id', initialFragranceId);
      } else {
        query = query.limit(1);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      setActiveFragrance(data);
    } catch (err) {
      console.error('Error bootstrapping initial fragrance:', err);
    } finally {
      setLoading(false);
    }
  }
  loadInitial();
}, [initialFragranceId]);

  // 2. Fetch neighbor cluster whenever activeFragrance changes
  const fetchNeighbors = useCallback(async (targetId) => {
    if (!targetId) return;

    try {
      await Promise.resolve();
      setLoading(true);
      const { data, error: rpcErr } = await supabase.rpc('get_similar_fragrances', {
        target_id: targetId,
        match_limit: 24, // Keeps graph clean and legible without visual clutter
      });

      if (rpcErr) throw rpcErr;
      setNeighbors(data || []);
    } catch (err) {
      console.error('Failed to load similar fragrance cluster:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFragrance?.id) {
      const timeoutId = setTimeout(() => {
        fetchNeighbors(activeFragrance.id);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [activeFragrance, fetchNeighbors]);

  // Function to switch focus directly
  const focusFragrance = (fragrance) => {
  setActiveFragrance(fragrance);
  if (fragrance?.id) {
    const url = new URL(window.location);
    url.searchParams.set('focus', fragrance.id);
    window.history.replaceState({}, '', url);
  }
};

  return {
    activeFragrance,
    neighbors,
    loading,
    error,
    focusFragrance,
  };
}