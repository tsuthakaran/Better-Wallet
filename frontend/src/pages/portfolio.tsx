import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import NavBarPortfolio from "@/components/portfolio/navbar";
import { useWallet } from "@/hooks/use-wallet";
import { useTickerPrices } from "@/hooks/use-ticker-prices";
import { CryptoLabelsAttributes, FiatAssets } from "@/data/crypto-info";

const FIAT_SYMBOLS = new Set(FiatAssets.map((f) => f.symbol));

function hslColor(index: number, total: number): string {
  const hue = Math.round((360 / Math.max(total, 1)) * index);
  return `hsl(${hue}, 65%, 55%)`;
}

interface Stats {
  change: number;
}

export default function Portfolio() {
  const { balances, loading: walletLoading } = useWallet();
  const [stats24h, setStats24h] = useState<Record<string, Stats>>({});

  const heldCryptoSymbols = CryptoLabelsAttributes
    .filter((c) => !FIAT_SYMBOLS.has(c.symbol) && (balances[c.symbol] ?? 0) > 0)
    .map((c) => c.symbol);

  const prices = useTickerPrices(heldCryptoSymbols);

  // Fetch 24h change for all held assets in one batch call
  useEffect(() => {
    if (heldCryptoSymbols.length === 0) return;
    const query = `[${heldCryptoSymbols.map((s) => `"${s}USDT"`).join(",")}]`;
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: { symbol: string; priceChangePercent: string }[]) => {
        const map: Record<string, Stats> = {};
        data.forEach((d) => {
          const sym = d.symbol.replace("USDT", "");
          map[sym] = { change: parseFloat(d.priceChangePercent) };
        });
        setStats24h(map);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldCryptoSymbols.join(",")]);

  const holdings = CryptoLabelsAttributes
    .filter((c) => !FIAT_SYMBOLS.has(c.symbol) && (balances[c.symbol] ?? 0) > 0)
    .map((c) => ({
      ...c,
      amount: balances[c.symbol] ?? 0,
      price: prices[c.symbol] ?? null,
      usdValue: prices[c.symbol] != null ? (balances[c.symbol] ?? 0) * prices[c.symbol] : null,
      change: stats24h[c.symbol]?.change ?? null,
    }))
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  const FIAT_USD_RATE: Record<string, number> = { USD: 1, USDT: 1, USDC: 1, GBP: 1.27 };

  const fiatHoldings = FiatAssets
    .filter((f) => (balances[f.symbol] ?? 0) > 0)
    .map((f) => ({ ...f, amount: balances[f.symbol] ?? 0 }));

  const fiatUsd = fiatHoldings.reduce((sum, f) => sum + f.amount * (FIAT_USD_RATE[f.symbol] ?? 1), 0);
  const totalUsd = holdings.reduce((sum, h) => sum + (h.usdValue ?? 0), 0) + fiatUsd;

  const allocationItems = [
    ...holdings
      .filter((h) => h.usdValue != null && h.usdValue > 0)
      .map((h, i) => ({ symbol: h.symbol, usd: h.usdValue ?? 0, color: hslColor(i, holdings.length) })),
    ...fiatHoldings
      .filter((f) => f.amount > 0)
      .map((f) => ({ symbol: f.symbol, usd: f.amount * (FIAT_USD_RATE[f.symbol] ?? 1), color: "rgba(255,255,255,0.18)" })),
  ];

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <NavBarPortfolio />
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Hero */}
          <div className="space-y-1">
            <p className="text-xs text-white/30 uppercase tracking-widest">Total portfolio value</p>
            {walletLoading ? (
              <div className="h-12 w-56 bg-[#F0E7A1]/10 rounded-xl animate-pulse" />
            ) : totalUsd > 0 ? (
              <p className="text-5xl font-bold text-[#F0E7A1]">
                ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : (
              <p className="text-5xl font-bold text-[#F0E7A1]/20">$0.00</p>
            )}
            <p className="text-sm text-white/25 pt-1">
              {holdings.length} crypto asset{holdings.length !== 1 ? "s" : ""}
              {fiatHoldings.length > 0 ? ` · ${fiatHoldings.length} cash position${fiatHoldings.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>

          {/* Allocation bar */}
          {allocationItems.length > 0 && totalUsd > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-white/30 uppercase tracking-widest">Allocation</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {allocationItems.map((item) => (
                  <div
                    key={item.symbol}
                    style={{ width: `${(item.usd / totalUsd) * 100}%`, background: item.color }}
                    title={`${item.symbol}: ${((item.usd / totalUsd) * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {allocationItems.map((item) => (
                  <div key={item.symbol} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-white/40">{item.symbol}</span>
                    <span className="text-xs text-white/20">{((item.usd / totalUsd) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings table */}
          <div className="bg-[#F0E7A1]/3 border border-[#F0E7A1]/10 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#F0E7A1]/8 text-[10px] font-medium text-white/30 uppercase tracking-widest">
              <span>Asset</span>
              <span className="text-right w-28">Amount</span>
              <span className="text-right w-28">Price</span>
              <span className="text-right w-28">Value</span>
              <span className="text-right w-20">24h</span>
            </div>

            {walletLoading ? (
              <div className="p-5 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-[#F0E7A1]/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : holdings.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-white/25 text-sm">No crypto holdings yet</p>
                <p className="text-white/15 text-xs mt-1">Deposit funds to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0E7A1]/5">
                {holdings.map((h, i) => {
                  const isPos = (h.change ?? 0) >= 0;
                  const allocationPct = totalUsd > 0 && h.usdValue != null
                    ? ((h.usdValue / totalUsd) * 100).toFixed(1)
                    : null;

                  return (
                    <div
                      key={h.symbol}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[#F0E7A1]/3 transition-colors"
                    >
                      {/* Asset */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                          style={{ background: hslColor(i, holdings.length) }}
                        >
                          {h.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#F0E7A1]/90">{h.symbol}</div>
                          <div className="text-xs text-white/30 truncate">{h.name}</div>
                        </div>
                        {allocationPct && (
                          <span className="text-[10px] text-white/20 ml-1">{allocationPct}%</span>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right w-28">
                        <span className="text-sm text-white/60 tabular-nums">
                          {h.amount.toFixed(6).replace(/\.?0+$/, "")}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-right w-28">
                        {h.price != null ? (
                          <span className="text-sm text-white/60 tabular-nums">
                            ${h.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-sm text-white/20">—</span>
                        )}
                      </div>

                      {/* USD Value */}
                      <div className="text-right w-28">
                        {h.usdValue != null ? (
                          <span className="text-sm font-medium text-[#F0E7A1]/70 tabular-nums">
                            ${h.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-sm text-white/20">—</span>
                        )}
                      </div>

                      {/* 24h change */}
                      <div className="text-right w-20">
                        {h.change != null ? (
                          <span className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                            {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isPos ? "+" : ""}{h.change.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fiat / stablecoins */}
          {fiatHoldings.length > 0 && (
            <div className="bg-[#F0E7A1]/3 border border-[#F0E7A1]/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0E7A1]/8">
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Cash & Stablecoins</p>
              </div>
              <div className="divide-y divide-[#F0E7A1]/5">
                {fiatHoldings.map((f) => (
                  <div key={f.symbol} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F0E7A1]/10 flex items-center justify-center text-xs font-bold text-[#F0E7A1]/60">
                        {f.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#F0E7A1]/80">{f.symbol}</div>
                        <div className="text-xs text-white/30">{f.name}</div>
                      </div>
                    </div>
                    <span className="text-sm text-white/60 tabular-nums">
                      {f.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
