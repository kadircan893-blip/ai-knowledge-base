import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import type { NavPage, Note } from '../../types';

interface LayoutProps {
  isOnline?: boolean;
  notes?: Note[];
  onOpenSearch?: () => void;
  children: (activePage: NavPage, onNavigate: (page: NavPage) => void) => React.ReactNode;
}

export default function Layout({ children, isOnline, notes, onOpenSearch }: LayoutProps) {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');

  const handleNavigate = (page: NavPage) => {
    setActivePage(page);
  };

  const handleNewNote = () => {
    setActivePage('notes');
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background Orbs */}
      <div className="bg-orb w-96 h-96 -top-20 -left-20"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
      <div className="bg-orb w-80 h-80 top-1/2 -right-20"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)' }} />
      <div className="bg-orb w-72 h-72 bottom-0 left-1/3"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }} />

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} notes={notes} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          activePage={activePage}
          onNewNote={handleNewNote}
          onOpenSearch={onOpenSearch ?? (() => {})}
          onNavigate={handleNavigate}
          isOnline={isOnline}
          notes={notes}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children(activePage, handleNavigate)}
        </main>
      </div>
    </div>
  );
}
