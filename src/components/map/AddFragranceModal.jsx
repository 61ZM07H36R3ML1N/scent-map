import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AddFragranceModal({ isOpen, onClose, onAdded }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [gender, setGender] = useState('unisex');
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const notesArray = rawNotes
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 1);

    if (notesArray.length < 2) {
      setError('Please add at least 2 comma-separated notes (e.g., Bergamot, Cedar).');
      setLoading(false);
      return;
    }

    try {
      const { data, error: insertErr } = await supabase
        .from('fragrances')
        .insert({
          name: name.trim(),
          house: house.trim(),
          gender,
          notes: Array.from(new Set(notesArray)),
          added_by: user?.id || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-zinc-900 mb-1">Add a Fragrance</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Add an unlisted bottle. Its position on the map is calculated dynamically based on note affinity.
        </p>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Fragrance Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nio"
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Perfume House / Brand</label>
            <input
              type="text"
              required
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="e.g. Xerjoff"
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Gender Profile</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 bg-white"
            >
              <option value="unisex">Unisex</option>
              <option value="masculine">Masculine</option>
              <option value="feminine">Feminine</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Notes (Comma Separated)</label>
            <textarea
              required
              rows={3}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Bergamot, Neroli, Pink Pepper, Jasmine, Vetiver, Guaiac Wood, Amber"
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publish to Scent-Map'}
          </button>
        </form>
      </div>
    </div>
  );
}