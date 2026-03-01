import { useEffect, useRef, useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import ChatPage from './pages/ChatPage';
import CategoriesPage from './pages/CategoriesPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastContainer from './components/ui/ToastContainer';
import QuickSearchModal from './components/ui/QuickSearchModal';
import HelpModal from './components/ui/HelpModal';
import InstallPrompt from './components/ui/InstallPrompt';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { useNotes } from './hooks/useNotes';
import type { NavPage } from './types';

// ── Main authenticated app — keyed by user.id so useNotes remounts per user ──
function AppContent() {
  const { notes, isLoading: notesLoading, isOnline, addNote, updateNote, deleteNote, resetNotes } = useNotes();

  const [showSearch, setShowSearch] = useState(false);
  const [showHelp,   setShowHelp]   = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const navigateRef = useRef<((page: NavPage) => void) | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (mod && e.key === 'k') { e.preventDefault(); setShowSearch((v) => !v); }
      if (mod && e.key === '/') { e.preventDefault(); setShowHelp((v) => !v); }
      if (mod && e.key === 'n' && !inInput) {
        e.preventDefault();
        setCategoryFilter('');
        navigateRef.current?.('notes');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderPage = (activePage: NavPage, onNavigate: (page: NavPage) => void) => {
    navigateRef.current = onNavigate;
    if (notesLoading && activePage === 'dashboard') return <DashboardSkeleton />;

    return (
      <>
        <div className="page-enter" key={activePage}>
          {(() => {
            switch (activePage) {
              case 'dashboard':
                return <Dashboard notes={notes} onNavigate={onNavigate} onAddNote={addNote} />;
              case 'notes':
                return (
                  <NotesPage
                    notes={notes}
                    onAddNote={addNote}
                    onUpdateNote={updateNote}
                    onDeleteNote={deleteNote}
                    onNavigate={onNavigate}
                    initialCategoryFilter={categoryFilter}
                  />
                );
              case 'chat':
                return <ChatPage notes={notes} />;
              case 'categories':
                return (
                  <CategoriesPage
                    notes={notes}
                    onNavigate={onNavigate}
                    onNavigateToCategory={(cat) => { setCategoryFilter(cat); onNavigate('notes'); }}
                  />
                );
              case 'settings':
                return <SettingsPage noteCount={notes.length} onReset={resetNotes} />;
            }
          })()}
        </div>
        <QuickSearchModal
          open={showSearch}
          notes={notes}
          onClose={() => setShowSearch(false)}
          onNavigate={(page) => { onNavigate(page); setShowSearch(false); }}
        />
        <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      </>
    );
  };

  return (
    <>
      <Layout isOnline={isOnline} notes={notes} onOpenSearch={() => setShowSearch(true)}>
        {(activePage, onNavigate) => renderPage(activePage, onNavigate)}
      </Layout>
      <ToastContainer />
      <InstallPrompt />
    </>
  );
}

// ── Auth gate — remounts AppContent when user changes (fixes per-user isolation) ─
function AuthGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <DashboardSkeleton />;
  if (!user)     return <AuthPage />;
  return <AppContent key={user.id} />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
