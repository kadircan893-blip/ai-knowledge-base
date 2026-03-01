import { LayoutDashboard, FileText, MessageSquare, FolderOpen, Settings, Brain, Zap, LogOut } from 'lucide-react';
import type { NavPage, Note } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  notes?: Note[];
}

const navItems = [
  { id: 'dashboard'  as NavPage, label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'notes'      as NavPage, label: 'My Notes',   icon: FileText },
  { id: 'chat'       as NavPage, label: 'AI Chat',    icon: MessageSquare },
  { id: 'categories' as NavPage, label: 'Categories', icon: FolderOpen },
  { id: 'settings'   as NavPage, label: 'Settings',   icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, notes = [] }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-full flex-shrink-0 flex flex-col backdrop-blur-xl bg-white/5 border-r border-white/10">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">AI Knowledge</h1>
            <p className="text-white/40 text-xs font-medium">Base</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-4 pb-2 pt-2">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon     = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left ${isActive ? 'nav-item-active' : 'nav-item'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
              {item.id === 'chat' && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-medium">
                  AI
                </span>
              )}
              {item.id === 'notes' && notes.length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-medium">
                  {notes.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* AI Status */}
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">AI Engine</p>
            <p className="text-emerald-400 text-xs">Online & Ready</p>
          </div>
        </div>

        {/* User + Log Out */}
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
            <p className="text-white/30 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Çıkış Yap"
            className="text-white/30 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
