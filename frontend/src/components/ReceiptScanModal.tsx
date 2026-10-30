import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Sparkles, Check, CreditCard as CardIcon, Calendar, Store, DollarSign, Layers } from 'lucide-react';
import { api } from '../services/api';
import { ReceiptAnalysis, Account, CreditCard, Category, PaymentMethod } from '../types';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  onRateLimited: (seconds: number) => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  cards,
  categories,
  onRateLimited
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);

  // Form editável após análise
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [accountId, setAccountId] = useState<string>('');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      startScan(selected);
    }
  };

  const startScan = async (targetFile: File) => {
    setIsScanning(true);
    setAnalysis(null);

    try {
      const result = await api.scanReceipt(targetFile);
      setAnalysis(result);

      // Preenche os campos automaticamente
      setDescription(result.establishment || 'Despesa');
      setAmount(result.amount.toFixed(2));
      setDate(result.date || new Date().toISOString().split('T')[0]);

      // Sugere categoria correspondente
      const matchedCat = categories.find(c => c.name.toLowerCase().includes(result.category.toLowerCase()));
      if (matchedCat) setCategoryId(matchedCat.id);
      else if (categories.length > 0) setCategoryId(categories[0].id);

      // Sugere método de pagamento
      setPaymentMethod(result.suggestedPaymentMethod || 'PIX');
      setInstallments(result.suggestedInstallments || 1);

      if (cards.length > 0) setCreditCardId(cards[0].id);
      if (accounts.length > 0) setAccountId(accounts[0].id);

    } catch (err: any) {
      if (err.status === 429) {
        onRateLimited(err.waitSecondsToReset || 60);
        onClose();
        alert(`⚠️ Limite de 15 leituras/min atingido! O cronômetro foi acionado na tela.`);
      } else {
        alert('Não foi possível ler o comprovante automaticamente. Você pode preencher manualmente.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setIsSubmitting(true);
    try {
      await api.createTransaction({
        description,
        amount: parseFloat(amount),
        date,
        type: 'EXPENSE',
        paymentMethod,
        accountId: paymentMethod !== 'CREDIT_CARD' ? accountId : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' ? creditCardId : undefined,
        categoryId: categoryId || (categories[0] ? categories[0].id : undefined),
        totalInstallments: paymentMethod === 'CREDIT_CARD' ? installments : 1
      });

      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculo da projeção de parcelas
  const parsedAmount = parseFloat(amount) || 0;
  const installmentValue = installments > 1 ? (parsedAmount / installments).toFixed(2) : parsedAmount.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 transition-colors">
        
        {/* Header do Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Leitor Inteligente de Comprovantes</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Cupom fiscal, Nota fiscal ou Comprovante Pix</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 overflow-y-auto space-y-5">

          {/* Área de Upload / Câmera */}
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-900 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Tirar foto ou escolher comprovante</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Suporta fotos de celular (JPG, PNG) ou PDF</p>
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*,application/pdf" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <img src={preview} alt="Comprovante" className="w-14 h-14 object-cover rounded-xl border border-slate-300 dark:border-slate-700" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{file?.name}</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3" /> Analisado pelo Gemini Vision
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setFile(null); setPreview(null); setAnalysis(null); }}
                className="text-xs text-slate-500 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Trocar
              </button>
            </div>
          )}

          {/* Efeito de Scanner Carregando */}
          {isScanning && (
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="font-bold text-sm text-indigo-200">IA analisando o comprovante...</p>
                <p className="text-xs text-indigo-400/80 mt-1">Extraindo loja, valor total, data e itens comprados</p>
              </div>
            </div>
          )}

          {/* Formulário com Dados Detectados e Opções */}
          {(!isScanning && (analysis || preview)) && (
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Loja / Estabelecimento */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Onde comprou? (Estabelecimento)
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Ex: Supermercado Pão de Açúcar"
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Categoria</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Como você pagou?</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        paymentMethod === pm
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pm === 'PIX' && 'Pix'}
                      {pm === 'CREDIT_CARD' && 'Crédito'}
                      {pm === 'DEBIT_CARD' && 'Débito'}
                      {pm === 'CASH' && 'Dinheiro'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SE FOR CARTÃO DE CRÉDITO: Seleciona Cartão e Parcelamento */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <CardIcon className="w-4 h-4" /> Configurar Cartão & Parcelas
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Qual cartão?</label>
                      <select
                        value={creditCardId}
                        onChange={e => setCreditCardId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Número de Parcelas</label>
                      <select
                        value={installments}
                        onChange={e => setInstallments(parseInt(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold focus:outline-none"
                      >
                        <option value={1}>À vista (1x)</option>
                        {[2,3,4,5,6,7,8,9,10,12,18,24].map(n => (
                          <option key={n} value={n}>{n}x vezes</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Projeção Automática dos Meses Seguintes */}
                  {installments > 1 && (
                    <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
                        <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Projeção Automática:</span>
                        <strong className="text-emerald-400">{installments}x de R$ {installmentValue}</strong>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        O app criará automaticamente as {installments} parcelas distribuídas nas próximas faturas mensais do cartão.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SE FOR DÉBITO OU PIX: Escolhe a conta bancária */}
              {paymentMethod !== 'CREDIT_CARD' && accounts.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Saiu de qual conta?</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Saldo: R$ {a.currentBalance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botão de Confirmação */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Lançar Despesa</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

