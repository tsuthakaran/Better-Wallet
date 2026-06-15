/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CryptoLabelsAttributes, FiatAssets } from "@/data/crypto-info";
import { useWallet } from "@/hooks/use-wallet";
import { useTickerPrices } from "@/hooks/use-ticker-prices";
import DepositPanel from "./ReceivePanel";

const FIAT_SYMBOLS = new Set(FiatAssets.map((f) => f.symbol));
const STABLECOIN_USD: Record<string, number> = { USDT: 1, USDC: 1, USD: 1, GBP: 1.27 };

const fmtUsd = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCrypto = (n: number): string => {
  const fixed = n.toFixed(8).replace(/\.?0+$/, "");
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = parseInt(intPart || "0").toLocaleString();
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
};

const ALL_ASSETS = [
  ...CryptoLabelsAttributes.map((c) => ({ symbol: c.symbol, name: c.name })),
  ...FiatAssets.map((f) => ({ symbol: f.symbol, name: f.name })),
];

const NAME_TO_SYMBOL = Object.fromEntries(ALL_ASSETS.map((a) => [a.name, a.symbol]));
const CRYPTO_SYMBOLS = CryptoLabelsAttributes.map((c) => c.symbol);

type TransactionType = "Send" | "Request" | "Swap" | "Deposit";
const TABS: TransactionType[] = ["Send", "Request", "Swap", "Deposit"];

const TransactionMake = ({ onSuccess, initialTab }: { onSuccess?: () => void; initialTab?: string }) => {
  const [type, setType] = useState<TransactionType>(
    TABS.includes(initialTab as TransactionType) ? (initialTab as TransactionType) : "Send"
  );
  const [asset, setAsset] = useState("Bitcoin");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [swapTarget, setSwapTarget] = useState("Ethereum");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  const { balances } = useWallet();
  const prices = useTickerPrices(CRYPTO_SYMBOLS);

  const assetCode = NAME_TO_SYMBOL[asset] ?? asset;
  const swapTargetCode = NAME_TO_SYMBOL[swapTarget] ?? swapTarget;

  const livePrice = (sym: string): number | null => {
    if (STABLECOIN_USD[sym] != null) return STABLECOIN_USD[sym];
    return prices[sym] ?? null;
  };

  const assetPrice = livePrice(assetCode);
  const swapTargetPrice = livePrice(swapTargetCode);

  const usdValueNum = amount && assetPrice != null
    ? parseFloat(amount) * assetPrice
    : null;

  const swapOutputNum = amount && type === "Swap" && assetPrice != null && swapTargetPrice != null && swapTargetPrice > 0
    ? (parseFloat(amount) * assetPrice) / swapTargetPrice
    : null;

  const balance = balances[assetCode] ?? 0;

  // Asset options: all assets for Request, all assets for Send (backend validates balance),
  // crypto only for Swap
  const cryptoAssets = ALL_ASSETS.filter((a) => !FIAT_SYMBOLS.has(a.symbol));
  const fiatAssets = ALL_ASSETS.filter((a) => FIAT_SYMBOLS.has(a.symbol));

  const assetOptionList = useMemo(() => ALL_ASSETS, []);

  // Swap target: all crypto except current source
  const swapTargetList = useMemo(
    () => cryptoAssets.filter((a) => a.symbol !== assetCode),
    [assetCode]
  );

  const getReliabilityScore = async (input: string): Promise<number | null> => {
    const unreliableAssets: Record<string, number> = {
      Dogecoin: 25, Matic: 45, Algorand: 30, Fantom: 40,
      "Internet Computer": 35, Uniswap: 45, Stellar: 40,
    };
    if (input.startsWith("scam")) return 20;
    if (input.startsWith("unknown")) return null;
    if (unreliableAssets[input]) return unreliableAssets[input];
    return 85;
  };

  const resetConfirmation = () => {
    setShowConfirmation(false);
    setWarningMessage("");
    setWarningAcknowledged(false);
  };

  const switchTab = (t: TransactionType) => {
    setType(t);
    setAmount("");
    setAddress("");
    setAddressTouched(false);
    setErrorMessage("");
    resetConfirmation();
    // Reset asset to something sensible for the new tab
    if (t === "Swap") {
      setAsset("Bitcoin");
      setSwapTarget("Ethereum");
    } else {
      setAsset("Bitcoin");
    }
  };

  const handleReview = async () => {
    const amountNum = parseFloat(amount);

    if ((type === "Send" || type === "Swap") && amountNum > balance) {
      setErrorMessage("Not enough funds to complete this transaction.");
      return;
    }

    if ((type === "Send" || type === "Request") && (!address || address.length < 5)) {
      setAddressTouched(true);
      setErrorMessage("Please enter a valid wallet address.");
      return;
    }

    setErrorMessage("");
    setWarningMessage("");

    if (type === "Send") {
      const score = await getReliabilityScore(address);
      if (score === null) {
        setWarningMessage("We were unable to verify this recipient. Make sure you trust this address before confirming.");
      } else if (score < 50) {
        setWarningMessage(`This address has a low reliability score (${score}/100). Proceed with caution.`);
      }
    }

    if (type === "Swap") {
      const score = await getReliabilityScore(swapTarget);
      if (score === null) {
        setWarningMessage("We were unable to verify the reliability of this target asset.");
      } else if (score < 50) {
        setWarningMessage(`The target asset "${swapTarget}" has a low reliability score (${score}/100).`);
      }
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      let payload: Record<string, any>;

      if (type === "Swap") {
        const sourceUsd = assetPrice ?? 0;
        const targetUsd = swapTargetPrice ?? 1;
        const exchangeRate = parseFloat((sourceUsd / targetUsd).toFixed(8));
        payload = { type: "Swap", currency: assetCode, amount: parseFloat(amount), recipient: swapTargetCode, exchangeRate };
      } else {
        payload = { type, currency: assetCode, amount: parseFloat(amount), recipient: address };
      }

      const res = await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create transaction');
      }

      setAmount("");
      setAddress("");
      setAddressTouched(false);
      setSwapTarget("Ethereum");
      setAsset("Bitcoin");
      resetConfirmation();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage("Failed to submit transaction. Please try again.");
      resetConfirmation();
    }
  };

  const addressError = addressTouched
    ? (!address ? "Address required" : address.length < 5 ? "Must be at least 5 characters" : "")
    : "";

  const reviewDisabled =
    !amount ||
    parseFloat(amount) <= 0 ||
    ((type === "Send" || type === "Request") && !address);

  const showFiatGroup = true;

  return (
    <div className="text-[#F0E7A1] px-6 py-6 flex flex-col gap-5 w-full">

      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === t
                ? "bg-[#F0E7A1] text-black"
                : "bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/8"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {type === "Deposit" && <DepositPanel onSuccess={onSuccess} />}

      {type !== "Deposit" && (
        <>
          {/* Amount */}
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
            <p className="text-white/25 text-xs">
              Balance: {fmtCrypto(balance) || "0"} {assetCode}
            </p>
          </div>

          {/* Asset selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 font-medium uppercase tracking-wide">Asset</label>
            <div className="relative">
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#F0E7A1]/40 transition-colors cursor-pointer pr-9"
              >
                <optgroup label="Crypto" className="bg-[#111]">
                  {assetOptionList.filter((a) => !FIAT_SYMBOLS.has(a.symbol)).map((a) => (
                    <option key={a.symbol} value={a.name} className="bg-[#111]">
                      {a.name} ({a.symbol})
                    </option>
                  ))}
                </optgroup>
                {showFiatGroup && (
                  <optgroup label="Cash & Stablecoins" className="bg-[#111]">
                    {fiatAssets.map((a) => (
                      <option key={a.symbol} value={a.name} className="bg-[#111]">
                        {a.name} ({a.symbol})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Address field */}
          {(type === "Send" || type === "Request") && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 font-medium uppercase tracking-wide">
                {type === "Send" ? "Recipient address" : "Request from"}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setAddressTouched(true); }}
                onBlur={() => setAddressTouched(true)}
                placeholder="e.g. W4ABC1"
                className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/20 text-sm outline-none focus:border-[#F0E7A1]/40 transition-colors font-mono ${
                  addressError ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {addressError && (
                <p className="text-red-400 text-xs">{addressError}</p>
              )}
            </div>
          )}

          {/* Swap target */}
          {type === "Swap" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 font-medium uppercase tracking-wide">Swap to</label>
              <div className="relative">
                <select
                  value={swapTarget}
                  onChange={(e) => setSwapTarget(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#F0E7A1]/40 transition-colors cursor-pointer pr-9"
                >
                  {swapTargetList.map((a) => (
                    <option key={a.symbol} value={a.name} className="bg-[#111]">
                      {a.name} ({a.symbol})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
              {swapOutputNum != null && (
                <p className="text-xs text-white/30 px-1">
                  You will receive approximately {fmtCrypto(swapOutputNum)} {swapTargetCode}
                </p>
              )}
            </div>
          )}

          {/* Validation error */}
          {errorMessage && !showConfirmation && (
            <p className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-2.5">
              {errorMessage}
            </p>
          )}

          {/* Review button */}
          {!showConfirmation && (
            <button
              disabled={reviewDisabled}
              onClick={handleReview}
              className="w-full py-3 bg-[#F0E7A1] text-black font-semibold rounded-xl text-sm hover:bg-[#F0E7A1]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review transaction
            </button>
          )}

          {/* Confirmation panel */}
          {showConfirmation && (
            <div className="bg-[#111] border border-[#F0E7A1]/12 rounded-xl p-4 flex flex-col gap-4">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Confirm transaction</p>

              <div className="space-y-2.5 border-b border-white/8 pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Type</span>
                  <span className="text-sm text-white">{type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40">Amount</span>
                  <span className="text-sm font-semibold text-[#F0E7A1]">
                    {fmtCrypto(parseFloat(amount))} {assetCode}
                  </span>
                </div>
                {usdValueNum != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Value</span>
                    <span className="text-sm text-white/40">≈ ${fmtUsd(usdValueNum)}</span>
                  </div>
                )}
                {(type === "Send" || type === "Request") && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-white/40 flex-shrink-0">
                      {type === "Send" ? "To" : "From"}
                    </span>
                    <span className="text-xs font-mono text-white/60 break-all text-right">{address}</span>
                  </div>
                )}
                {type === "Swap" && swapOutputNum != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">You receive</span>
                    <span className="text-sm text-white/60">{fmtCrypto(swapOutputNum)} {swapTargetCode}</span>
                  </div>
                )}
                {type === "Swap" && assetPrice != null && swapTargetPrice != null && swapTargetPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Rate</span>
                    <span className="text-xs text-white/40">
                      1 {assetCode} = {fmtCrypto(assetPrice / swapTargetPrice)} {swapTargetCode}
                    </span>
                  </div>
                )}
              </div>

              {warningMessage && (
                <div className="bg-amber-400/8 border border-amber-400/20 rounded-lg p-3 flex flex-col gap-2.5">
                  <p className="text-amber-400 text-xs leading-relaxed">{warningMessage}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={warningAcknowledged}
                      onChange={(e) => setWarningAcknowledged(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span className="text-xs text-amber-300/80">I understand the risks and want to proceed</span>
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={resetConfirmation}
                  className="flex-1 py-2.5 border border-white/10 text-white/50 text-sm rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={warningMessage !== "" && !warningAcknowledged}
                  className="flex-1 py-2.5 bg-[#F0E7A1] text-black font-semibold text-sm rounded-xl hover:bg-[#F0E7A1]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionMake;
