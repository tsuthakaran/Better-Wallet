import React from "react";
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from "lucide-react";
import { TransactionDetailsProps } from "@/types";

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; iconClass: string; bgClass: string }> = {
  Deposit:  { Icon: ArrowDownLeft,  iconClass: "text-emerald-400", bgClass: "bg-emerald-400/10" },
  Withdraw: { Icon: ArrowUpRight,   iconClass: "text-red-400",     bgClass: "bg-red-400/10"     },
  Send:     { Icon: ArrowUpRight,   iconClass: "text-red-400",     bgClass: "bg-red-400/10"     },
  Request:  { Icon: Clock,          iconClass: "text-amber-400",   bgClass: "bg-amber-400/10"   },
  Swap:     { Icon: ArrowLeftRight, iconClass: "text-blue-400",    bgClass: "bg-blue-400/10"    },
};

const STATUS_CLASS: Record<string, string> = {
  completed: "bg-emerald-400/15 text-emerald-400 border-emerald-400/20",
  pending:   "bg-amber-400/15 text-amber-400 border-amber-400/20",
  failed:    "bg-red-400/15 text-red-400 border-red-400/20",
};

const AMOUNT_COLOR: Record<string, string> = {
  Deposit: "text-emerald-400",
  Withdraw: "text-red-400",
  Send: "text-red-400",
};

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  type, crypto, amount, recipient, transactionId, date, time, fee, status, onClose,
}) => {
  const config = TYPE_CONFIG[type] ?? { Icon: ArrowLeftRight, iconClass: "text-white/30", bgClass: "bg-white/5" };
  const { Icon, iconClass, bgClass } = config;
  const statusClass = STATUS_CLASS[status?.toLowerCase()] ?? "bg-white/10 text-white/30 border-white/10";
  const amountColor = AMOUNT_COLOR[type] ?? "text-[#F0E7A1]";

  const fmtCrypto = (n: number): string => {
    const fixed = n.toFixed(6).replace(/\.?0+$/, "");
    const [intPart, decPart] = fixed.split(".");
    const formattedInt = parseInt(intPart || "0").toLocaleString();
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };
  const displayAmount = `${fmtCrypto(Number(amount))} ${crypto}`;

  const subtitle = type === "Send"    ? `To ${recipient}`
                 : type === "Request" ? `From ${recipient}`
                 : type === "Swap"    ? `${crypto} → ${recipient}`
                 : null;

  const rows = [
    { label: "Transaction ID", value: transactionId, mono: true },
    { label: "Date", value: date },
    { label: "Time", value: time },
    { label: "Fee", value: fee },
  ];

  return (
    <div className="w-[360px] max-w-[calc(100vw-2rem)] bg-[#111] border border-[#F0E7A1]/12 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <span className="text-sm font-medium text-white/50">Transaction details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white/50" />
          </button>
        )}
      </div>

      {/* Icon + amount */}
      <div className="flex flex-col items-center gap-3 px-5 pb-5 border-b border-[#F0E7A1]/8">
        <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center`}>
          <Icon size={22} className={iconClass} />
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${amountColor}`}>{displayAmount}</p>
          {subtitle && <p className="text-xs text-white/35 mt-1">{subtitle}</p>}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
          {status}
        </span>
      </div>

      {/* Details rows */}
      <div className="px-5 py-4 space-y-3.5">
        {rows.map(({ label, value, mono }) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <span className="text-xs text-white/35 flex-shrink-0">{label}</span>
            <span className={`text-xs text-white/70 text-right break-all ${mono ? "font-mono" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionDetails;
