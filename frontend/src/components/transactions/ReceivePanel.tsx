import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CryptoLabelsAttributes, FiatAssets } from "@/data/crypto-info";
import { useTickerPrices } from "@/hooks/use-ticker-prices";

const FIAT_SYMBOLS = new Set(FiatAssets.map((f) => f.symbol));
const STABLECOIN_USD: Record<string, number> = { USDT: 1, USDC: 1, USD: 1 };

const ALL_ASSETS = [
  ...CryptoLabelsAttributes.map((c) => ({ symbol: c.symbol, name: c.name })),
  ...FiatAssets.map((f) => ({ symbol: f.symbol, name: f.name })),
];

const NAME_TO_SYMBOL = Object.fromEntries(ALL_ASSETS.map((a) => [a.name, a.symbol]));
const CRYPTO_SYMBOLS = CryptoLabelsAttributes.map((c) => c.symbol);

const cryptoAssets = ALL_ASSETS.filter((a) => !FIAT_SYMBOLS.has(a.symbol));
const fiatAssets = ALL_ASSETS.filter((a) => FIAT_SYMBOLS.has(a.symbol));

const fmtUsd = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCrypto = (n: number): string => {
  const fixed = n.toFixed(8).replace(/\.?0+$/, "");
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = parseInt(intPart || "0").toLocaleString();
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
};

interface DepositPanelProps {
  onSuccess?: () => void;
}

const DepositPanel = ({ onSuccess }: DepositPanelProps) => {
  const [asset, setAsset] = useState("Bitcoin");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const prices = useTickerPrices(CRYPTO_SYMBOLS);
  const assetSymbol = NAME_TO_SYMBOL[asset] ?? asset;
  const assetPrice = STABLECOIN_USD[assetSymbol] ?? prices[assetSymbol] ?? null;
  const usdValueNum = amount && assetPrice != null ? parseFloat(amount) * assetPrice : null;

  const handleReview = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError("");
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/transactions", {
        method: "POST",
        body: JSON.stringify({
          type: "Deposit",
          currency: assetSymbol,
          amount: parseFloat(amount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to confirm deposit");
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount("");
        setShowConfirmation(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to confirm deposit.");
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="bg-[#111] border border-[#F0E7A1]/12 rounded-xl p-4 flex flex-col gap-4">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Confirm deposit</p>

        <div className="space-y-2.5 border-b border-white/8 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Asset</span>
            <span className="text-sm text-white">{asset} ({assetSymbol})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Amount</span>
            <span className="text-sm font-semibold text-[#F0E7A1]">
              {fmtCrypto(parseFloat(amount))} {assetSymbol}
            </span>
          </div>
          {usdValueNum != null && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Value</span>
              <span className="text-sm text-white/40">≈ ${fmtUsd(usdValueNum)}</span>
            </div>
          )}
        </div>

        {success ? (
          <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3 text-center text-emerald-400 text-sm">
            Deposit confirmed
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
              className="flex-1 py-2.5 border border-white/10 text-white/50 text-sm rounded-xl hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 bg-[#F0E7A1] text-black font-semibold text-sm rounded-xl hover:bg-[#F0E7A1]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Confirming…" : "Confirm deposit"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 py-3">
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          className="w-full bg-transparent text-[#F0E7A1] text-5xl font-light text-center outline-none placeholder-[#F0E7A1]/15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="h-px w-24 bg-[#F0E7A1]/15 mt-1" />
        {usdValueNum != null ? (
          <p className="text-white/35 text-sm mt-2">≈ ${fmtUsd(usdValueNum)}</p>
        ) : (
          <p className="text-white/20 text-sm mt-2">—</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/40 font-medium uppercase tracking-wide">Asset</label>
        <div className="relative">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#F0E7A1]/40 transition-colors cursor-pointer pr-9"
          >
            <optgroup label="Crypto" className="bg-[#111]">
              {cryptoAssets.map((a) => (
                <option key={a.symbol} value={a.name} className="bg-[#111]">
                  {a.name} ({a.symbol})
                </option>
              ))}
            </optgroup>
            <optgroup label="Cash & Stablecoins" className="bg-[#111]">
              {fiatAssets.map((a) => (
                <option key={a.symbol} value={a.name} className="bg-[#111]">
                  {a.name} ({a.symbol})
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        onClick={handleReview}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-3 bg-[#F0E7A1] text-black font-semibold rounded-xl text-sm hover:bg-[#F0E7A1]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Review deposit
      </button>
    </div>
  );
};

export default DepositPanel;
