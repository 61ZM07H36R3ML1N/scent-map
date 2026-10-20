import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Share2, Check, Send, ThumbsUp } from 'lucide-react';

export default function CommunityFeedDrawer({ fragrance, onOpenAuth }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('fragrance_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('fragrance_id', fragrance.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setComments(data || []);
  }, [fragrance.id]);

  useEffect(() => {
    if (!fragrance?.id) return;
    void Promise.resolve().then(loadComments);

    // Subscribe to new incoming comments in real-time
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
  }, [fragrance?.id, loadComments]);

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

  return (
    <aside className="absolute top-16 right-5 bottom-5 w-80 bg-white/95 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-xl flex flex-col overflow-hidden z-20 font-sans">
      {/* Top Header */}
      <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          Community Hub
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded-md transition cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
          {copied ? 'Copied Link' : 'Share Map'}
        </button>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-400 font-mono">
            No community impressions yet. Be the first to review {fragrance.name}.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                <span className="font-bold text-zinc-800">{c.profiles?.username || 'Collector'}</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-700 leading-snug">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Box / Auth Trigger */}
      <div className="p-3 border-t border-zinc-100 bg-white">
        {user ? (
          <form onSubmit={handlePostComment} className="flex gap-1.5">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Thoughts on ${fragrance.name}...`}
              className="flex-1 bg-zinc-100 border border-transparent focus:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-zinc-900 text-white p-2 rounded-lg hover:bg-black transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2 text-center text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition cursor-pointer"
          >
            Log in to post reviews
          </button>
        )}
      </div>
    </aside>
  );
}