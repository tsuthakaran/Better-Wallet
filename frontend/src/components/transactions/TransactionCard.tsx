import React from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from "lucide-react";

interface TransactionCardProps {
  _id: string;
  type: string;
  crypto: string;
  amount: string | number;
  recipient: string;
  status: string;
  transactionId: string;
  date: string;
  time: string;
  fee: string;
  onClick: () => void;
}

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; iconClass: string; bgClass: string }> = {
  Deposit:  { Icon: ArrowDownLeft,  iconClass: "text-emerald-400", bgClass: "bg-emerald-400/10" },
  Withdraw: { Icon: ArrowUpRight,   iconClass: "text-red-400",     bgClass: "bg-red-400/10"     },
  Send:     { Icon: ArrowUpRight,   iconClass: "text-red-400",     bgClass: "bg-red-400/10"     },
  Request:  { Icon: Clock,          iconClass: "text-amber-400",   bgClass: "bg-amber-400/10"   },
  Swap:     { Icon: ArrowLeftRight, iconClass: "text-blue-400",    bgClass: "bg-blue-400/10"    },
};

const STATUS_CLASS: Record<string, string> = {
  completed: "bg-emerald-400/15 text-emerald-400",
  pending:   "bg-amber-400/15 text-amber-400",
  failed:    "bg-red-400/15 text-red-400",
};

const TransactionCard: React.FC<TransactionCardProps> = ({
  type, crypto, amount, recipient, status, date, onClick,
}) => {
  const config = TYPE_CONFIG[type] ?? { Icon: ArrowLeftRight, iconClass: "text-white/30", bgClass: "bg-white/5" };
  const { Icon, iconClass, bgClass } = config;
  const statusClass = STATUS_CLASS[status?.toLowerCase()] ?? "bg-white/10 text-white/30";

  const subtitle = type === "Send"    ? `To ${recipient}`
                 : type === "Request" ? `From ${recipient}`
                 : type === "Swap"    ? `To ${recipient}`
                 : null;

  const fmtCrypto = (n: number): string => {
    const fixed = n.toFixed(6).replace(/\.?0+$/, "");
    const [intPart, decPart] = fixed.split(".");
    const formattedInt = parseInt(intPart || "0").toLocaleString();
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };
  const displayAmount = `${fmtCrypto(Number(amount))} ${crypto}`;
  const amountColor = type === "Deposit" ? "text-emerald-400" : type === "Send" || type === "Withdraw" ? "text-red-400" : "text-[#F0E7A1]";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#111] border border-[#F0E7A1]/8 rounded-xl px-4 py-3.5 hover:border-[#F0E7A1]/20 hover:bg-white/[0.02] transition-all text-left"
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-full ${bgClass} flex items-center justify-center`}>
        <Icon size={16} className={iconClass} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{type}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusClass}`}>
            {status}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-white/30 truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-semibold ${amountColor}`}>{displayAmount}</p>
        <p className="text-xs text-white/25 mt-0.5">{date}</p>
      </div>
    </button>
  );
};

export default TransactionCard;
