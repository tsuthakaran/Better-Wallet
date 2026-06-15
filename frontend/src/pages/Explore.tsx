/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import NavBarPortfolio from "@/components/portfolio/navbar";
import { useMarketMovers, MarketMover } from "@/hooks/use-market-movers";
import { useTimeRangeContext } from "@/hooks/time-range-context";
import { use24hStats } from "@/hooks/use-24h-stats";
import { CryptoLabelsAttributes } from "@/data/crypto-info";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { TimeRange } from "@/types";

const TIME_RANGES: TimeRange[] = ["1H", "1D", "7D", "14D", "1M", "1Y", "ALL"];

const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A", ETH: "#627EEA", BNB: "#F3BA2F", SOL: "#9945FF",
  XRP: "#346AA9", DOGE: "#C2A633", ADA: "#2E5F9A", AVAX: "#E84142",
  TON: "#0098EA", TRX: "#FF060A",
};

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function fmtVol(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Explore() {
  const { movers, loading: moversLoading } = useMarketMovers();
  const [query, setQuery] = useState("");
  const [extraResult, setExtraResult] = useState<MarketMover | null>(null);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState(false);

  const filtered = query
    ? movers.filter(
        m =>
          m.symbol.toLowerCase().includes(query.toLowerCase()) ||
          m.name.toLowerCase().includes(query.toLowerCase())
      )
    : movers;

  const showBinanceSearch = query.length >= 2 && filtered.length === 0 && !extraResult;

  const searchBinance = useCallback(async () => {
    const sym = query.toUpperCase().replace(/\s/g, "");
    setExtraLoading(true);
    setExtraError(false);
    setExtraResult(null);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`);
      const data = await res.json();
      if (data.lastPrice) {
        setExtraResult({
          symbol: sym,
          name: sym,
          price: parseFloat(data.lastPrice),
          priceChangePercent: parseFloat(data.priceChangePercent),
          quoteVolume: parseFloat(data.quoteVolume),
        });
      } else {
        setExtraError(true);
      }
    } catch {
      setExtraError(true);
    } finally {
      setExtraLoading(false);
    }
  }, [query]);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setExtraResult(null);
    setExtraError(false);
  };

  const {
    historicalData, realTimePrice, selectedCrypto, setSelectedCrypto,
    error, currentConfig, yAxisDomain, timeRange, setTimeRange, isLoading,
  } = useTimeRangeContext();

  const stats = use24hStats(selectedCrypto);
  const currentCrypto = CryptoLabelsAttributes.find(c => c.symbol === selectedCrypto);
  const isPositive = (stats?.priceChangePercent ?? 0) >= 0;
  const chartData = historicalData.map(d => ({ ...d, date: d.timeStamp }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#111] border border-[#F0E7A1]/20 px-3 py-2 rounded-lg text-sm">
          <p className="text-[#F0E7A1]/50">{currentConfig.tickFormatter(label ?? "")}</p>
          <p className="text-[#F0E7A1] font-semibold">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <NavBarPortfolio />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: market list */}
        <div className="w-72 border-r border-white/5 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/5">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Search assets…"
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 outline-none focus:border-[#F0E7A1]/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {moversLoading ? (
              <div className="py-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-10 bg-white/5 animate-pulse rounded" />
                      <div className="h-2.5 w-16 bg-white/5 animate-pulse rounded" />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <div className="h-3 w-14 bg-white/5 animate-pulse rounded" />
                      <div className="h-2.5 w-10 bg-white/5 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-1">
                {(extraResult ? [extraResult, ...filtered] : filtered).map((coin) => {
                  const up = coin.priceChangePercent >= 0;
                  const active = selectedCrypto === coin.symbol;
                  const color = COIN_COLORS[coin.symbol] ?? "#F0E7A1";
                  return (
                    <button
                      key={coin.symbol}
                      onClick={() => setSelectedCrypto(coin.symbol)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active ? "bg-[#F0E7A1]/8" : "hover:bg-white/3"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {coin.symbol.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${active ? "text-[#F0E7A1]" : "text-white/80"}`}>
                          {coin.symbol}
                        </span>
                        {coin.name !== coin.symbol && (
                          <p className="text-[11px] text-white/25 mt-0.5 truncate">{coin.name}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-medium tabular-nums ${active ? "text-[#F0E7A1]" : "text-white/70"}`}>
                          ${fmtPrice(coin.price)}
                        </p>
                        <p className={`text-[11px] mt-0.5 tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                          {up ? "+" : ""}{coin.priceChangePercent.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Binance fallback search */}
                {showBinanceSearch && (
                  <button
                    onClick={searchBinance}
                    className="w-full px-4 py-3 text-left hover:bg-white/3 transition-colors"
                  >
                    <p className="text-sm text-[#F0E7A1]/50">
                      Search Binance for <span className="text-[#F0E7A1]">"{query.toUpperCase()}"</span>
                    </p>
                    <p className="text-[11px] text-white/20 mt-0.5">Look up any USDT pair</p>
                  </button>
                )}
                {extraLoading && (
                  <div className="px-4 py-3">
                    <div className="h-3 w-24 bg-white/5 animate-pulse rounded" />
                  </div>
                )}
                {extraError && (
                  <p className="px-4 py-3 text-sm text-white/25">
                    No USDT pair found for "{query.toUpperCase()}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: chart */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#F0E7A1]">{selectedCrypto}</span>
                {currentCrypto && (
                  <span className="text-sm text-[#F0E7A1]/30">{currentCrypto.name}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-white">
                  {realTimePrice != null
                    ? `$${realTimePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
                {stats && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isPositive ? "+" : ""}{stats.priceChangePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-[#F0E7A1]/5 border border-[#F0E7A1]/10 rounded-xl p-1">
              {TIME_RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    timeRange === r
                      ? "bg-[#F0E7A1] text-black"
                      : "text-[#F0E7A1]/40 hover:text-[#F0E7A1] hover:bg-[#F0E7A1]/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 24h stats */}
          {stats && (
            <div className="flex items-center gap-8 px-6 py-3 border-y border-white/5 flex-shrink-0">
              {[
                { label: "24h High", value: `$${stats.highPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                { label: "24h Low",  value: `$${stats.lowPrice.toLocaleString(undefined,  { maximumFractionDigits: 2 })}` },
                { label: "24h Volume", value: fmtVol(stats.quoteVolume) },
                {
                  label: "24h Change",
                  value: `${isPositive ? "+" : ""}${stats.priceChangePercent.toFixed(2)}%`,
                  colored: true,
                },
              ].map(({ label, value, colored }) => (
                <div key={label}>
                  <div className="text-[10px] text-white/25 uppercase tracking-wider">{label}</div>
                  <div className={`text-sm font-medium mt-0.5 ${colored ? (isPositive ? "text-emerald-400" : "text-red-400") : "text-white/60"}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 px-2 pb-4 min-h-0">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <p className="text-white/20 text-sm">Chart data unavailable</p>
                <p className="text-white/12 text-xs">Try selecting a different coin or time range</p>
              </div>
            ) : isLoading || chartData.length === 0 ? (
              <div className="h-full flex items-end justify-around px-6 pb-6 gap-1">
                {[55, 40, 65, 50, 75, 60, 80, 65, 70, 85, 68, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/5 animate-pulse rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="exploreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F0E7A1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F0E7A1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E7A1" opacity={0.05} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="transparent"
                    tick={{ fill: "#F0E7A1", opacity: 0.3, fontSize: 11 }}
                    tickFormatter={d => currentConfig.tickFormatter(d)}
                    interval={currentConfig.tickInterval}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="transparent"
                    tick={{ fill: "#F0E7A1", opacity: 0.3, fontSize: 11 }}
                    tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(2)}`}
                    domain={yAxisDomain}
                    allowDataOverflow={false}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#F0E7A1"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#exploreGradient)"
                    activeDot={{ r: 4, fill: "#F0E7A1", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
