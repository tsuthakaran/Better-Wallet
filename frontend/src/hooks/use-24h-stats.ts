import { useState, useEffect } from 'react';

export interface Stats24h {
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export function use24hStats(symbol: string): Stats24h | null {
  const [stats, setStats] = useState<Stats24h | null>(null);

  useEffect(() => {
    if (!symbol || symbol === 'TOTAL') return;
    setStats(null);

    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`)
      .then(res => res.json())
      .then(data => {
        if (data.priceChangePercent !== undefined) {
          setStats({
            priceChangePercent: parseFloat(data.priceChangePercent),
            highPrice: parseFloat(data.highPrice),
            lowPrice: parseFloat(data.lowPrice),
            volume: parseFloat(data.volume),
            quoteVolume: parseFloat(data.quoteVolume),
          });
        }
      })
      .catch(() => {});
  }, [symbol]);

  return stats;
}
