import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Helper to normalize strings for comparison ("club-de-nuit-intense-man" vs "Club De Nuit Intense Man")
function normalizeTitle(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function useFragranceGraph(initialFragranceId = null) {
  const [activeFragrance, setActiveFragrance] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState(null);

  // 1. Initial Load
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
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

  // 2. Fetch and Deduplicate Neighbors
  const fetchNeighbors = useCallback(async (targetId, targetName, gender) => {
    if (!targetId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_similar_fragrances', {
        target_id: targetId,
        match_limit: 45,
        filter_gender: gender || null,
      });

      if (error) throw error;

      const rawList = data || [];
      const normalizedTarget = normalizeTitle(targetName);

      const seenNames = new Set();
      const uniqueCluster = [];

      for (const item of rawList) {
        const normItemName = normalizeTitle(item.name);

        // Never show the center active bottle as a floating neighbor
        if (normItemName === normalizedTarget || item.id === targetId) {
          continue;
        }

        // Keep only first occurrence of duplicate titles
        if (!seenNames.has(normItemName)) {
          seenNames.add(normItemName);
          uniqueCluster.push(item);
        }

        if (uniqueCluster.length >= 22) break;
      }

      setNeighbors(uniqueCluster);
    } catch (err) {
      console.error('Failed to load similar fragrance cluster:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeFragrance?.id) {
      fetchNeighbors(activeFragrance.id, activeFragrance.name, genderFilter);
    }
  }, [activeFragrance, genderFilter, fetchNeighbors]);

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
    genderFilter,
    setGenderFilter,
    focusFragrance,
  };
}

export default useFragranceGraph;