import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password, username);
        if (error) throw error;
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-zinc-900 mb-1">
          {isSignUp ? 'Create an Account' : 'Welcome to Scent-Map'}
        </h2>
        <p className="text-xs text-zinc-500 mb-5">
          Join the community to save bottles, post impressions, and contribute notes.
        </p>

        {error && (
          <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
                placeholder="parfum_collector"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
              placeholder="brian@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-zinc-800"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono bg-white px-2 text-zinc-400">
            Or
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 rounded-lg transition cursor-pointer"
        >
          Continue with Google
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}