import { useState } from 'react';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  // Form state
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);

  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUsername(''); setEmail(''); setPassword(''); setConfirm(''); setError('');
  };

  const switchTab = (t: Tab) => { setTab(t); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register') {
      if (!username.trim())      { setError('Username is required'); return; }
      if (password !== confirm)  { setError('Passwords do not match'); return; }
      if (password.length < 6)   { setError('Password must be at least 6 characters'); return; }
    }

    setIsLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(username.trim(), email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1a3e, #0d1b2a)' }}>

      {/* Background orbs */}
      <div className="absolute w-96 h-96 rounded-full -top-20 -left-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
      <div className="absolute w-80 h-80 rounded-full -bottom-10 -right-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)' }} />
      <div className="absolute w-60 h-60 rounded-full top-1/2 left-1/4 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">AI Knowledge Base</h1>
          <p className="text-white/40 text-sm mt-1">Your personal knowledge hub</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/8 border border-white/15 rounded-3xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username — register only */}
            {tab === 'register' && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                  className="glass-input w-full py-2.5 px-4 text-sm"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); e.target.setCustomValidity(''); }}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please enter a valid email address')}
                placeholder="you@example.com"
                required
                className="glass-input w-full py-2.5 px-4 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="glass-input w-full py-2.5 px-4 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password — register only */}
            {tab === 'register' && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="glass-input w-full py-2.5 px-4 text-sm"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Please wait...</>
              ) : tab === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Switch hint */}
          <p className="text-center text-white/30 text-xs mt-6">
            {tab === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => switchTab('register')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchTab('login')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
