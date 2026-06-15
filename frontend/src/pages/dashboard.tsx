import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Clock, TrendingUp, TrendingDown, ChevronRight, Copy, Check } from "lucide-react";
import NavBarPortfolio from "@/components/portfolio/navbar";
import { useWallet } from "@/hooks/use-wallet";
import { useTickerPrices } from "@/hooks/use-ticker-prices";
import { getTransactionHistory } from "@/data/transaction-history";
import { CryptoLabelsAttributes, FiatAssets } from "@/data/crypto-info";
import { auth } from "@/firebase";

const FIAT_SYMBOLS = new Set(FiatAssets.map((f) => f.symbol));

interface RecentTx {
  _id: string;
  type: string;
  crypto: string;
  amount: string;
  status: string;
  date: string;
}

interface Stats {
  change: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { balances, wAddress, loading: walletLoading } = useWallet();
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([]);
  const [stats24h, setStats24h] = useState<Record<string, Stats>>({});

  const heldCryptoSymbols = CryptoLabelsAttributes
    .filter((c) => !FIAT_SYMBOLS.has(c.symbol) && (balances[c.symbol] ?? 0) > 0)
    .map((c) => c.symbol);

  const prices = useTickerPrices(heldCryptoSymbols);

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
      usdValue: prices[c.symbol] != null ? (balances[c.symbol] ?? 0) * prices[c.symbol] : null,
      change: stats24h[c.symbol]?.change ?? null,
    }))
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  const FIAT_USD_RATE: Record<string, number> = { USD: 1, USDT: 1, USDC: 1, GBP: 1.27 };
  const fiatUsd = FiatAssets
    .filter((f) => (balances[f.symbol] ?? 0) > 0)
    .reduce((sum, f) => sum + (balances[f.symbol] ?? 0) * (FIAT_USD_RATE[f.symbol] ?? 1), 0);
  const totalUsd = holdings.reduce((sum, h) => sum + (h.usdValue ?? 0), 0) + fiatUsd;

  useEffect(() => {
    if (!auth.currentUser) return;
    getTransactionHistory()
      .then((txs: any[]) =>
        setRecentTxs(
          txs.slice(0, 6).map((tx) => ({
            _id: tx.id ?? tx._id,
            type: tx.type,
            crypto: tx.currency,
            amount: tx.amount,
            status: tx.status,
            date: tx.createdAt,
          }))
        )
      )
      .catch(() => {});
  }, []);

  const [addressCopied, setAddressCopied] = useState(false);
  const handleCopyAddress = () => {
    if (!wAddress) return;
    navigator.clipboard.writeText(wAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const quickActions = [
    { label: "Send",    icon: ArrowUpRight,   tab: undefined,   color: "text-red-400" },
    { label: "Deposit", icon: ArrowDownLeft,  tab: "Deposit",   color: "text-emerald-400" },
    { label: "Swap",    icon: ArrowLeftRight, tab: "Swap",      color: "text-blue-400" },
    { label: "History", icon: Clock,          tab: undefined,   color: "text-[#F0E7A1]" },
  ];

  const txTypeColor: Record<string, string> = {
    deposit:  "text-emerald-400",
    withdraw: "text-red-400",
    send:     "text-red-400",
    receive:  "text-emerald-400",
    swap:     "text-blue-400",
    request:  "text-amber-400",
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <NavBarPortfolio />
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

          {/* Hero: portfolio value + quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Total value card */}
            <div className="md:col-span-2 bg-[#F0E7A1]/5 border border-[#F0E7A1]/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs text-[#F0E7A1]/40 uppercase tracking-widest mb-2">Total Portfolio Value</p>
                {walletLoading ? (
                  <div className="h-10 w-40 bg-[#F0E7A1]/10 rounded-lg animate-pulse" />
                ) : totalUsd > 0 ? (
                  <p className="text-4xl font-bold text-[#F0E7A1]">
                    ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="text-4xl font-bold text-[#F0E7A1]/20">$—</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                {wAddress && (
                  <button onClick={handleCopyAddress} className="flex items-center gap-1.5 group">
                    {addressCopied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#F0E7A1]/20 group-hover:text-[#F0E7A1]/40 transition-colors" />
                    )}
                    <span className="text-xs font-mono text-[#F0E7A1]/20 group-hover:text-[#F0E7A1]/40 transition-colors">
                      {addressCopied ? "Copied!" : `${wAddress.slice(0, 6)}…${wAddress.slice(-4)}`}
                    </span>
                  </button>
                )}
                <Link
                  to="/Portfolio"
                  className="flex items-center gap-1 text-xs text-[#F0E7A1]/50 hover:text-[#F0E7A1] transition-colors ml-auto"
                >
                  View portfolio <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, icon: Icon, tab, color }) => (
                <button
                  key={label}
                  onClick={() => navigate("/Transaction", { state: tab ? { tab } : undefined })}
                  className="bg-[#F0E7A1]/5 border border-[#F0E7A1]/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#F0E7A1]/10 hover:border-[#F0E7A1]/20 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-black/40 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-[#F0E7A1]/60 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Holdings + Recent transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Holdings */}
            <div className="bg-[#F0E7A1]/5 border border-[#F0E7A1]/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0E7A1]/10 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F0E7A1]">Holdings</h2>
                <Link
                  to="/Portfolio"
                  className="text-[10px] text-[#F0E7A1]/30 hover:text-[#F0E7A1]/60 transition-colors uppercase tracking-widest"
                >
                  View all
                </Link>
              </div>

              {walletLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-[#F0E7A1]/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : holdings.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-[#F0E7A1]/20">No holdings yet</p>
                  <button
                    onClick={() => navigate("/Transaction", { state: { tab: "Deposit" } })}
                    className="mt-3 text-xs text-[#F0E7A1]/40 hover:text-[#F0E7A1] transition-colors underline underline-offset-2"
                  >
                    Deposit funds to get started
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F0E7A1]/5">
                  {holdings.map((h) => {
                    const isPos = (h.change ?? 0) >= 0;
                    const amtFormatted = (() => {
                      const fixed = h.amount.toFixed(6).replace(/\.?0+$/, "");
                      const [int, dec] = fixed.split(".");
                      return dec ? `${parseInt(int).toLocaleString()}.${dec}` : parseInt(int).toLocaleString();
                    })();
                    return (
                      <div key={h.symbol} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#F0E7A1]/10 flex items-center justify-center text-[10px] font-bold text-[#F0E7A1]/60 flex-shrink-0">
                            {h.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#F0E7A1]/80">{h.symbol}</div>
                            <div className="text-[10px] text-[#F0E7A1]/30">{amtFormatted} {h.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {h.usdValue != null ? (
                            <div className="text-sm text-[#F0E7A1]/70">
                              ${h.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <div className="text-sm text-[#F0E7A1]/20">—</div>
                          )}
                          {h.change != null && (
                            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium mt-0.5 ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                              {isPos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                              {isPos ? "+" : ""}{h.change.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {FiatAssets.filter((f) => (balances[f.symbol] ?? 0) > 0).map((f) => {
                    const amt = balances[f.symbol] ?? 0;
                    const usd = amt * (FIAT_USD_RATE[f.symbol] ?? 1);
                    return (
                      <div key={f.symbol} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#F0E7A1]/10 flex items-center justify-center text-[10px] font-bold text-[#F0E7A1]/60 flex-shrink-0">
                            {f.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#F0E7A1]/80">{f.symbol}</div>
                            <div className="text-[10px] text-[#F0E7A1]/30">
                              {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {f.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#F0E7A1]/70">
                            ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-[#F0E7A1]/5 border border-[#F0E7A1]/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0E7A1]/10 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F0E7A1]">Recent transactions</h2>
                <Link
                  to="/Transaction"
                  className="text-[10px] text-[#F0E7A1]/30 hover:text-[#F0E7A1]/60 transition-colors uppercase tracking-widest"
                >
                  View all
                </Link>
              </div>

              {recentTxs.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-[#F0E7A1]/20">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0E7A1]/5">
                  {recentTxs.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-[10px] font-bold ${txTypeColor[tx.type?.toLowerCase()] ?? "text-[#F0E7A1]/40"}`}>
                            {tx.type?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className={`text-sm font-medium capitalize ${txTypeColor[tx.type?.toLowerCase()] ?? "text-[#F0E7A1]/60"}`}>
                            {tx.type}
                          </div>
                          <div className="text-[10px] text-[#F0E7A1]/30">
                            {tx.crypto} · {tx.date ? new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#F0E7A1]/60 tabular-nums">
                          {(() => {
                            const n = Number(tx.amount);
                            const fixed = n.toFixed(6).replace(/\.?0+$/, "");
                            const [int, dec] = fixed.split(".");
                            const fmt = dec ? `${parseInt(int).toLocaleString()}.${dec}` : parseInt(int).toLocaleString();
                            return `${fmt} ${tx.crypto}`;
                          })()}
                        </div>
                        <div className={`text-[10px] capitalize mt-0.5 ${tx.status === "completed" ? "text-emerald-400/60" : tx.status === "pending" ? "text-amber-400/60" : "text-red-400/60"}`}>
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
