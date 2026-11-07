import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);

  useEffect(() => {
    // Verifica se já está instalado e rodando como standalone app
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Já está instalado, não exibe banner
    }

    // Se o usuário já dispensou nesta sessão
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      return;
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // No iOS Safari não há o evento beforeinstallprompt, então mostramos o banner após 2s
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Para Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#131B2E]/95 dark:bg-[#131B2E]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-950/60 text-white">
        
        {/* Header do Banner */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/pwa-192x192.png" 
              alt="Finanças Pro" 
              className="w-12 h-12 rounded-2xl shadow-lg shadow-indigo-600/40 object-cover shrink-0" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">Instalar Finanças Pro</h3>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                  <Sparkles size={10} /> App
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Adicione à tela inicial para abrir como app nativo com navegação rápida!
              </p>
            </div>
          </div>

          <button 
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instruções para iOS (quando clicado no iPhone) */}
        {showIOSInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-200 space-y-2 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20">
            <p className="font-semibold text-indigo-300">Como instalar no iPhone:</p>
            <ol className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                1. Toque no botão de <strong>Compartilhar</strong> <Share size={14} className="text-indigo-400 shrink-0" /> na barra do Safari.
              </li>
              <li className="flex items-center gap-2">
                2. Role para baixo e selecione <strong className="flex items-center gap-1">Adicionar à Tela de Início <PlusSquare size={14} className="text-indigo-400 shrink-0" /></strong>.
              </li>
              <li>
                3. Toque em <strong>Adicionar</strong> no topo direito. Pronto!
              </li>
            </ol>
          </div>
        )}

        {/* Botão de Ação */}
        {!showIOSInstructions && (
          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Download size={14} />
              {isIOS ? 'Ver Como Instalar' : 'Instalar App Grátis'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
