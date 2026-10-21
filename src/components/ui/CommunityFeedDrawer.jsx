import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Share2, Check, Send, X } from 'lucide-react';

export default function CommunityFeedDrawer({ fragrance, onOpenAuth, isOpen, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!fragrance?.id || !isOpen) return;
    loadComments();

    const channel = supabase
      .channel(`comments_${fragrance.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fragrance_comments', filter: `fragrance_id=eq.${fragrance.id}` },
        () => loadComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fragrance?.id, isOpen]);

  async function loadComments() {
    const { data } = await supabase
      .from('fragrance_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('fragrance_id', fragrance.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setComments(data || []);
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    await supabase.from('fragrance_comments').insert({
      fragrance_id: fragrance.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    setNewComment('');
    setSubmitting(false);
  }

  function handleShare() {
    const url = `${window.location.origin}?focus=${fragrance.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // If not open, render absolutely nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer: Bottom Sheet on Mobile, Right Panel on Desktop */}
      <aside className="relative z-50 w-full sm:w-96 h-[75vh] sm:h-full mt-auto sm:mt-0 bg-white sm:border-l border-zinc-200 rounded-t-2xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Community Hub</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-600 hover:text-black bg-zinc-100 px-2 py-1 rounded-md transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-800 rounded-md transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comment Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400 font-mono">
              No community impressions yet. Be the first to review {fragrance?.name}.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-white border border-zinc-200/80 p-3 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                  <span className="font-bold text-zinc-800">{c.profiles?.username || 'Collector'}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-zinc-700 leading-snug">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 border-t border-zinc-200 bg-white shrink-0">
          {user ? (
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Thoughts on ${fragrance?.name || 'this scent'}...`}
                className="flex-1 bg-zinc-100 border border-transparent focus:border-zinc-300 rounded-lg px-3 py-2 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-zinc-900 text-white px-3 py-2 rounded-lg hover:bg-black transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 text-center text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              Log in to post reviews
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}