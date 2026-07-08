import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'VUV' | 'XPF' | 'FJD' | 'AUD' | 'NZD';

const rates: Record<CurrencyCode, number> = {
  VUV: 1.0,
  XPF: 0.93,
  FJD: 0.019,
  AUD: 0.013,
  NZD: 0.014
};

const currencyLabels: Record<CurrencyCode, string> = {
  VUV: 'Vatu (VUV)',
  XPF: 'Franc (XPF)',
  FJD: 'Fiji Dollar (FJD)',
  AUD: 'Aust Dollar (AUD)',
  NZD: 'NZ Dollar (NZD)'
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (vuvAmount: number, perUnitSuffix?: string) => string;
  currencyLabel: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nakamal_currency') as CurrencyCode;
      if (saved && rates[saved] !== undefined) {
        return saved;
      }
    }
    return 'VUV';
  });

  const setCurrency = (code: CurrencyCode) => {
    if (rates[code] !== undefined) {
      setCurrencyState(code);
      localStorage.setItem('nakamal_currency', code);
    }
  };

  const formatPrice = (vuvAmount: number, perUnitSuffix: string = '') => {
    const rate = rates[currency] || 1.0;
    const isNegative = vuvAmount < 0;
    const absAmount = Math.abs(vuvAmount);
    const converted = absAmount * rate;
    
    let formatted = '';
    switch (currency) {
      case 'XPF':
        formatted = `${Math.round(converted).toLocaleString()} XPF`;
        break;
      case 'FJD':
        formatted = `FJ$ ${converted.toFixed(2)}`;
        break;
      case 'AUD':
        formatted = `A$ ${converted.toFixed(2)}`;
        break;
      case 'NZD':
        formatted = `NZ$ ${converted.toFixed(2)}`;
        break;
      case 'VUV':
      default:
        formatted = `${Math.round(converted).toLocaleString()} VUV`;
        break;
    }
    
    const sign = isNegative ? '-' : '';
    return `${sign}${formatted}${perUnitSuffix}`;
  };

  const currencyLabel = currencyLabels[currency];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, currencyLabel }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
