import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Clock, Bell, ArrowUpDown } from "lucide-react";
import TransactionCard from "@/components/transactions/TransactionCard";
import TransactionDetails from "@/components/transactions/TransactionDetails";
import TransactionMake from "@/components/transactions/TransactionMake";
import NavBarPortfolio from "@/components/portfolio/navbar";
import { getTransactionHistory } from "@/data/transaction-history";
import { apiFetch } from "@/lib/api";
import { auth } from "@/firebase";

interface Transaction {
  _id: string;
  walletId: string;
  type: string;
  crypto: string;
  amount: string;
  recipient: string;
  status: string;
  transactionId: string;
  date: string;
  time: string;
  fee: string;
  rawDate: number;
}

const formatTx = (tx: any): Transaction => {
  const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
  return {
    _id: tx.id ?? tx._id,
    walletId: tx.walletId,
    type: tx.type,
    crypto: tx.currency,
    amount: tx.amount,
    recipient: tx.recipient ?? "",
    status: tx.status,
    transactionId: tx.transactionId,
    date: createdAt ? createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "",
    time: createdAt ? createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
    fee: tx.fee != null ? `£${Number(tx.fee).toFixed(2)}` : "£0.00",
    rawDate: createdAt ? createdAt.getTime() : 0,
  };
};

const FILTER_TYPES = ["All", "Deposit", "Send", "Request", "Swap", "Withdraw"] as const;
type FilterType = typeof FILTER_TYPES[number];
type SortOrder = "newest" | "oldest" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest",      label: "Newest first" },
  { value: "oldest",      label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high–low" },
  { value: "amount-asc",  label: "Amount: low–high" },
];

const Transactions = () => {
  const location = useLocation();
  const initialTab = (location.state as any)?.tab;
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const loadTransactions = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const history = await getTransactionHistory();
      setTransactions(history.map(formatTx));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleRespond = async (txId: string, approved: boolean) => {
    setRespondingId(txId);
    try {
      const res = await apiFetch(`/transactions/${txId}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to respond");
      }
      await loadTransactions();
    } catch (err: any) {
      console.error("Error responding to request:", err);
      alert(err.message || "Failed to respond to request.");
    } finally {
      setRespondingId(null);
    }
  };

  const currentUid = auth.currentUser?.uid;
  const incomingRequests = transactions.filter(
    (tx) => tx.type === "Request" && tx.status === "pending" && tx.walletId !== currentUid,
  );

  const visibleTransactions = useMemo(() => {
    let list = filterType === "All" ? transactions : transactions.filter((tx) => tx.type === filterType);
    return [...list].sort((a, b) => {
      if (sortOrder === "newest")      return b.rawDate - a.rawDate;
      if (sortOrder === "oldest")      return a.rawDate - b.rawDate;
      if (sortOrder === "amount-desc") return Number(b.amount) - Number(a.amount);
      if (sortOrder === "amount-asc")  return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [transactions, filterType, sortOrder]);

  return (
    <>
      <NavBarPortfolio />
      <div className="flex relative" style={{ height: "calc(100vh - 4rem)" }}>

        {/* Left: history */}
        <div className="w-1/2 bg-black overflow-y-auto h-full px-6 py-5 flex flex-col gap-4">

          {/* Pending requests */}
          {incomingRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <Bell size={14} />
                <span>Pending requests ({incomingRequests.length})</span>
              </div>
              {incomingRequests.map((tx) => (
                <div key={tx._id} className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#F0E7A1]">
                    {Number(tx.amount).toFixed(6).replace(/\.?0+$/, "")} {tx.crypto}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5 mb-3">
                    Someone is requesting this from your balance
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={respondingId === tx._id}
                      onClick={() => handleRespond(tx._id, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      {respondingId === tx._id ? "Processing…" : "Approve"}
                    </button>
                    <button
                      disabled={respondingId === tx._id}
                      onClick={() => handleRespond(tx._id, false)}
                      className="flex-1 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#F0E7A1]/8" />
            </div>
          )}

          {/* Filter + sort bar */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {FILTER_TYPES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterType === f
                      ? "bg-[#F0E7A1] text-black"
                      : "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end">
              <ArrowUpDown size={12} className="text-white/30" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-transparent text-white/40 text-xs outline-none cursor-pointer hover:text-white/60 transition-colors"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#111] text-white">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction list */}
          {visibleTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F0E7A1]/6 flex items-center justify-center mb-4">
                <Clock size={20} className="text-[#F0E7A1]/25" />
              </div>
              <p className="text-white/35 text-sm">
                {filterType === "All" ? "No transactions yet" : `No ${filterType.toLowerCase()} transactions`}
              </p>
              <p className="text-white/20 text-xs mt-1">
                {filterType === "All" ? "Your activity will appear here" : "Try a different filter"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleTransactions.map((tx) => (
                <TransactionCard
                  key={tx._id}
                  {...tx}
                  onClick={() => setSelectedTransaction(tx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: make transaction */}
        <div className="w-1/2 bg-[#0a0a0a] border-l border-[#F0E7A1]/6 overflow-y-auto h-full">
          <TransactionMake onSuccess={loadTransactions} initialTab={initialTab} />
        </div>

        {/* Transaction detail overlay */}
        {selectedTransaction && (
          <div
            className="absolute inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSelectedTransaction(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <TransactionDetails
                type={selectedTransaction.type}
                crypto={selectedTransaction.crypto}
                amount={selectedTransaction.amount}
                recipient={selectedTransaction.recipient}
                transactionId={selectedTransaction.transactionId || "—"}
                date={selectedTransaction.date || "—"}
                time={selectedTransaction.time || "—"}
                fee={selectedTransaction.fee || "£0.00"}
                status={selectedTransaction.status}
                onClose={() => setSelectedTransaction(null)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Transactions;
