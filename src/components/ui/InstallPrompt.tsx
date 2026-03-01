import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-2rem))]
      backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl
      flex items-center gap-3 px-4 py-3 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500
        flex items-center justify-center text-white font-bold text-sm select-none">
        AI
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">Uygulamayı kur</p>
        <p className="text-white/50 text-xs mt-0.5">Offline çalışır, masaüstüne ekle</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90
          transition-opacity flex-shrink-0"
      >
        <Download size={13} />
        Kur
      </button>
      <button
        onClick={() => setVisible(false)}
        className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0 p-1"
        aria-label="Kapat"
      >
        <X size={16} />
      </button>
    </div>
  );
}
