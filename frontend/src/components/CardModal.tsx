import React, { useState } from 'react';
import { X, Check, CreditCard as CardIcon, ShieldCheck, Sparkles } from 'lucide-react';
import { CreditCard } from '../types';
import { BANK_PRESETS, BankPreset } from '../constants/banks';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<CreditCard>) => void;
  initialCard?: CreditCard | null;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(initialCard?.bank || 'nubank');
  const [name, setName] = useState<string>(initialCard?.name || 'Nubank Ultravioleta');
  const [limitTotal, setLimitTotal] = useState<string>(initialCard ? String(initialCard.limitTotal) : '5000');
  const [closingDay, setClosingDay] = useState<number>(initialCard ? initialCard.closingDay : 25);
  const [dueDay, setDueDay] = useState<number>(initialCard ? initialCard.dueDay : 5);

  if (!isOpen) return null;

  const currentPreset = BANK_PRESETS.find(b => b.id === selectedBankId) || BANK_PRESETS[0];

  const handleSelectBank = (preset: BankPreset) => {
    setSelectedBankId(preset.id);
    setName(`${preset.name} Cartão`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !limitTotal) return;

    onSave({
      name,
      bank: selectedBankId,
      limitTotal: parseFloat(limitTotal),
      closingDay,
      dueDay,
      color: currentPreset.color
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CardIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {initialCard ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          
          {/* Preview Interativo do Cartão em Tempo Real */}
          <div className={`p-6 rounded-3xl bg-gradient-to-br ${currentPreset.gradient} text-white shadow-2xl relative overflow-hidden transition-all duration-300 ring-2 ring-black/10`}>
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider bg-white/20 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                  {currentPreset.logoLetter}
                </span>
                <span className="font-bold text-sm tracking-wide">{name || 'Meu Cartão'}</span>
              </div>
              <span className="text-[11px] font-semibold text-white/80 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-white" /> Platinum
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[11px] text-white/70 block uppercase tracking-wider font-semibold">Limite Disponível</span>
                <p className="text-2xl font-black tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(limitTotal) || 0)}
                </p>
              </div>
              <div className="text-right text-xs text-white/90 font-medium">
                <p>Fecha dia <strong className="text-white font-bold">{closingDay}</strong></p>
                <p>Vence dia <strong className="text-white font-bold">{dueDay}</strong></p>
              </div>
            </div>
          </div>

          {/* Seleção Rápida de Bancos Brasileiros com Cores e Logos */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
              Qual é o Banco ou Emissor?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BANK_PRESETS.map(preset => {
                const isSelected = selectedBankId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectBank(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: preset.color }}
                    >
                      {preset.logoLetter.slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome e Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nome do Cartão</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Limite Total (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={limitTotal}
                onChange={e => setLimitTotal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Datas de Fechamento e Vencimento */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Dia de Fechamento</label>
              <select
                value={closingDay}
                onChange={e => setClosingDay(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Dia de Vencimento</label>
              <select
                value={dueDay}
                onChange={e => setDueDay(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Cartão</span>
          </button>
        </form>

      </div>
    </div>
  );
};

