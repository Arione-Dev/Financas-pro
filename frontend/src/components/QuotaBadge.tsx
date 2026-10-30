import React, { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { QuotaStatus } from '../types';

interface QuotaBadgeProps {
  onResetTrigger?: () => void;
  externalWaitSeconds?: number;
}

export const QuotaBadge: React.FC<QuotaBadgeProps> = ({ externalWaitSeconds = 0 }) => {
  const [quota, setQuota] = useState<QuotaStatus>({
    isAllowed: true,
    availableTokens: 15,
    maxTokens: 15,
    waitSecondsToReset: 0,
    message: ''
  });
  const [countdown, setCountdown] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  useEffect(() => {
    loadQuota();
    const interval = setInterval(loadQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (externalWaitSeconds > 0) {
      setCountdown(externalWaitSeconds);
    }
  }, [externalWaitSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerResetSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const loadQuota = async () => {
    try {
      const q = await api.getQuotaStatus();
      setQuota(q);
      if (q.waitSecondsToReset > 0 && countdown === 0) {
        setCountdown(q.waitSecondsToReset);
      }
    } catch (e) {}
  };

  const triggerResetSuccess = () => {
    loadQuota();
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  return (
    <>
      {/* Notificação Pop-up animada quando reseta */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <p className="font-bold text-xs">Cota de IA Liberada!</p>
            <p className="text-[11px] text-emerald-100">Você já pode enviar novos comprovantes.</p>
          </div>
        </div>
      )}

      {/* Badge de Status */}
      {countdown > 0 ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Limite de 15/min atingido • Liberando em <strong className="text-amber-300">{countdown}s</strong></span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>IA Gemini: <strong className="text-white">{quota.availableTokens}/{quota.maxTokens}</strong> req/min</span>
        </div>
      )}
    </>
  );
};

