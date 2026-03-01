import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, Plus, Clock, Settings, LogOut, ChevronDown } from 'lucide-react';
import type { NavPage, Note } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activePage: NavPage;
  onNewNote: () => void;
  onOpenSearch: () => void;
  onNavigate: (page: NavPage) => void;
  isOnline?: boolean;
  notes?: Note[];
}

const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: "Welcome back! Here's your knowledge overview." },
  notes: { title: 'My Notes', subtitle: 'Manage and organize your knowledge.' },
  chat: { title: 'AI Chat', subtitle: 'Ask questions about your notes.' },
  categories: { title: 'Categories', subtitle: 'Browse notes by category.' },
  settings: { title: 'Settings', subtitle: 'Configure your preferences.' },
};

export default function Navbar({ activePage, onNewNote, onOpenSearch, onNavigate, isOnline, notes }: NavbarProps) {
  const { user, logout } = useAuth();
  const { title, subtitle } = pageTitles[activePage];

  // Bell state
  const [showBell, setShowBell] = useState(false);
  const [bellRect, setBellRect] = useState<DOMRect | null>(null);
  const bellBtnRef  = useRef<HTMLButtonElement>(null);
  const bellDropRef = useRef<HTMLDivElement>(null);

  // Avatar state
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);
  const avatarBtnRef  = useRef<HTMLButtonElement>(null);
  const avatarDropRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showBell && !showAvatar) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (showBell &&
        bellDropRef.current && !bellDropRef.current.contains(t) &&
        bellBtnRef.current  && !bellBtnRef.current.contains(t)) {
        setShowBell(false);
      }
      if (showAvatar &&
        avatarDropRef.current && !avatarDropRef.current.contains(t) &&
        avatarBtnRef.current  && !avatarBtnRef.current.contains(t)) {
        setShowAvatar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBell, showAvatar]);

  const handleBellClick = () => {
    if (bellBtnRef.current) setBellRect(bellBtnRef.current.getBoundingClientRect());
    setShowAvatar(false);
    setShowBell((v) => !v);
  };

  const handleAvatarClick = () => {
    if (avatarBtnRef.current) setAvatarRect(avatarBtnRef.current.getBoundingClientRect());
    setShowBell(false);
    setShowAvatar((v) => !v);
  };

  const recentNotes = (notes ?? [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex-shrink-0 h-20 flex items-center px-6 border-b border-white/10 backdrop-blur-xl bg-white/5">
      {/* Page Title */}
      <div className="flex-1">
        <h2 className="text-white font-bold text-xl">{title}</h2>
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mx-4">
        <div className="relative cursor-pointer" onClick={onOpenSearch}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search notes...  (Ctrl+K)"
            readOnly
            className="glass-input pl-10 py-2 text-sm w-60 rounded-xl cursor-pointer select-none"
          />
        </div>
      </div>

      {/* Server status */}
      {isOnline !== undefined && (
        <div className="flex items-center gap-1.5 mr-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
          <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-white/30'}`}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewNote}
          className="btn-primary flex items-center gap-2 py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>

        {/* Bell */}
        <button
          ref={bellBtnRef}
          onClick={handleBellClick}
          className="relative w-10 h-10 glass-card flex items-center justify-center hover:bg-white/20 transition-colors rounded-xl"
        >
          <Bell className="w-4 h-4 text-white/60" />
          {recentNotes.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
          )}
        </button>

        {/* Bell dropdown portal */}
        {showBell && bellRect && createPortal(
          <div
            ref={bellDropRef}
            style={{ position: 'fixed', top: bellRect.bottom + 8, right: window.innerWidth - bellRect.right }}
            className="w-72 backdrop-blur-xl bg-[#0f172a]/95 border border-white/15 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white font-semibold text-sm">Recent Activity</p>
            </div>
            {recentNotes.length === 0 ? (
              <div className="px-4 py-6 text-center text-white/30 text-sm">No notes yet</div>
            ) : (
              <ul>
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-start gap-3"
                      onClick={() => { onNavigate('notes'); setShowBell(false); }}
                    >
                      <Clock className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm truncate font-medium">{note.title}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(note.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-white/10 px-4 py-2.5">
              <button
                className="text-purple-400 text-xs font-medium hover:text-purple-300 transition-colors"
                onClick={() => { onNavigate('notes'); setShowBell(false); }}
              >
                View all notes →
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Avatar button */}
        <button
          ref={avatarBtnRef}
          onClick={handleAvatarClick}
          className="flex items-center gap-1.5 rounded-xl hover:opacity-80 transition-opacity"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
          >
            {initial}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${showAvatar ? 'rotate-180' : ''}`} />
        </button>

        {/* Avatar dropdown portal */}
        {showAvatar && avatarRect && createPortal(
          <div
            ref={avatarDropRef}
            style={{ position: 'fixed', top: avatarRect.bottom + 8, right: window.innerWidth - avatarRect.right }}
            className="w-60 backdrop-blur-xl bg-[#0f172a]/95 border border-white/15 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.username}</p>
                <p className="text-white/40 text-xs truncate">{user?.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3"
                onClick={() => { onNavigate('settings'); setShowAvatar(false); }}
              >
                <Settings className="w-4 h-4 text-white/50" />
                <span className="text-white/80 text-sm">Settings</span>
              </button>
              <button
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-3"
                onClick={() => { logout(); setShowAvatar(false); }}
              >
                <LogOut className="w-4 h-4 text-red-400/70" />
                <span className="text-red-400/80 text-sm">Sign Out</span>
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </header>
  );
}
