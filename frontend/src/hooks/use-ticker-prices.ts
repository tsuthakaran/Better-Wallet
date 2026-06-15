import { useState, useEffect } from 'react';

const FIAT = new Set(['USD', 'GBP', 'EUR', 'USDT', 'USDC', 'DAI', 'BUSD']);

export function useTickerPrices(symbols: string[]): Record<string, number> {
  const [prices, setPrices] = useState<Record<string, number>>({});

  const cryptoSymbols = symbols.filter(s => !FIAT.has(s));
  const key = cryptoSymbols.slice().sort().join(',');

  useEffect(() => {
    if (cryptoSymbols.length === 0) return;

    const query = `[${cryptoSymbols.map(s => `"${s}USDT"`).join(',')}]`;
    fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then((data: { symbol: string; price: string }[]) => {
        const map: Record<string, number> = {};
        data.forEach(item => {
          const sym = item.symbol.replace('USDT', '');
          map[sym] = parseFloat(item.price);
        });
        setPrices(map);
      })
      .catch(() => {});
  }, [key]);

  return prices;
}
