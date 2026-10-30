export interface BankPreset {
  id: string;
  name: string;
  color: string;
  gradient: string;
  textColor: string;
  logoLetter: string;
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'nubank',
    name: 'Nubank',
    color: '#820AD1',
    gradient: 'from-purple-700 via-[#820AD1] to-purple-950',
    textColor: 'text-white',
    logoLetter: 'Nu'
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    color: '#FF7A00',
    gradient: 'from-orange-500 via-[#FF7A00] to-amber-700',
    textColor: 'text-white',
    logoLetter: 'inter'
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    color: '#CC092F',
    gradient: 'from-red-600 via-[#CC092F] to-rose-950',
    textColor: 'text-white',
    logoLetter: 'b'
  },
  {
    id: 'itau',
    name: 'Itaú',
    color: '#EC7000',
    gradient: 'from-orange-600 via-[#EC7000] to-blue-950',
    textColor: 'text-white',
    logoLetter: 'Itaú'
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    color: '#005CA9',
    gradient: 'from-blue-600 via-[#005CA9] to-cyan-950',
    textColor: 'text-white',
    logoLetter: 'X'
  },
  {
    id: 'pan',
    name: 'Banco PAN',
    color: '#00A3FF',
    gradient: 'from-sky-500 via-[#00A3FF] to-blue-900',
    textColor: 'text-white',
    logoLetter: 'PAN'
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago / Livre',
    color: '#00AAEE',
    gradient: 'from-cyan-500 via-[#00AAEE] to-blue-800',
    textColor: 'text-white',
    logoLetter: 'MP'
  },
  {
    id: 'santander',
    name: 'Santander',
    color: '#EA1D2C',
    gradient: 'from-red-500 via-[#EA1D2C] to-red-950',
    textColor: 'text-white',
    logoLetter: 'S'
  },
  {
    id: 'c6bank',
    name: 'C6 Bank',
    color: '#242424',
    gradient: 'from-neutral-800 via-[#242424] to-neutral-950',
    textColor: 'text-white',
    logoLetter: 'C6'
  },
  {
    id: 'outro',
    name: 'Outro Banco',
    color: '#4F46E5',
    gradient: 'from-indigo-600 via-indigo-700 to-slate-900',
    textColor: 'text-white',
    logoLetter: 'Card'
  }
];

export const getBankPreset = (bankIdOrName?: string): BankPreset => {
  if (!bankIdOrName) return BANK_PRESETS[0];
  const query = bankIdOrName.toLowerCase();
  
  const found = BANK_PRESETS.find(b => 
    b.id.toLowerCase() === query ||
    b.name.toLowerCase().includes(query) ||
    query.includes(b.name.toLowerCase()) ||
    query.includes(b.id.toLowerCase())
  );
  
  return found || BANK_PRESETS[BANK_PRESETS.length - 1]; // fallback para 'outro'
};

