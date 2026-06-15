import { useState, useEffect } from 'react';
import { CryptoLabelsAttributes } from '@/data/crypto-info';

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent: number;
  quoteVolume: number;
}

const ALL_SYMBOLS = CryptoLabelsAttributes.map(c => c.symbol);

export function useMarketMovers(): { movers: MarketMover[]; loading: boolean } {
  const [movers, setMovers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = ALL_SYMBOLS.map(s => `"${s}USDT"`).join(',');
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`)
      .then(res => res.json())
      .then((data: { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }[]) => {
        const nameMap = Object.fromEntries(CryptoLabelsAttributes.map(c => [c.symbol, c.name]));
        const parsed: MarketMover[] = data.map(d => {
          const sym = d.symbol.replace('USDT', '');
          return {
            symbol: sym,
            name: nameMap[sym] ?? sym,
            price: parseFloat(d.lastPrice),
            priceChangePercent: parseFloat(d.priceChangePercent),
            quoteVolume: parseFloat(d.quoteVolume),
          };
        });
        // sort by volume descending
        parsed.sort((a, b) => b.quoteVolume - a.quoteVolume);
        setMovers(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { movers, loading };
}
