"use client";
import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { auth } from "@/firebase";
import { apiFetch } from "@/lib/api";

const FAQ_ITEMS = [
  {
    q: "How do I send cryptocurrency?",
    a: "Go to Transactions and select Send. Choose your asset, enter the recipient's wallet address and the amount, then review and confirm.",
  },
  {
    q: "How do I deposit funds?",
    a: "Go to Transactions and select Deposit. Pick an asset, enter the amount, and confirm. The balance updates immediately.",
  },
  {
    q: "What is a swap?",
    a: "A swap converts one cryptocurrency into another at the current live Binance rate. Go to Transactions → Swap, choose your source and target asset, enter an amount, and confirm.",
  },
  {
    q: "How is my portfolio value calculated?",
    a: "Your total is the sum of all crypto holdings (priced live from Binance) plus any fiat or stablecoin balances converted to USD.",
  },
  {
    q: "What does the allocation bar show?",
    a: "The bar on the Portfolio page shows each asset's share of your total portfolio value. Crypto assets are colour-coded; cash and stablecoins appear in grey.",
  },
  {
    q: "How do I secure my account?",
    a: "Enable two-factor authentication in Settings → Security. Use a strong, unique password and never share your wallet address or private credentials.",
  },
];

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/3 border border-white/10 rounded-xl p-6">{children}</div>
);

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left gap-4"
      >
        <span className="text-sm text-white/80">{q}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-white/30 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-sm text-white/40 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
};

export const SupportSection = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const email = auth.currentUser?.email ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !message.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/support/threads", {
        method: "POST",
        body: JSON.stringify({ content: `[Rating: ${rating}/5] From ${email}: ${message}` }),
      });
      setSubmitted(true);
      setRating(0);
      setMessage("");
    } catch {
      // best-effort in simulation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* FAQ */}
      <Card>
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-1">
          Frequently asked questions
        </h3>
        <div className="mt-1">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </Card>

      {/* Feedback */}
      <Card>
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">
          Send feedback
        </h3>
        {submitted ? (
          <div className="py-2">
            <p className="text-sm text-emerald-400">Thanks — your feedback has been received.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-xs text-white/40 hover:text-white transition-colors underline underline-offset-2"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 font-medium uppercase tracking-wide block mb-2">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={20}
                      className={`transition-colors ${
                        star <= (hover || rating)
                          ? "text-[#F0E7A1] fill-[#F0E7A1]"
                          : "text-white/15"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 font-medium uppercase tracking-wide block mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience…"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm outline-none focus:border-[#F0E7A1]/40 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!rating || !message.trim() || submitting}
              className="px-5 py-2.5 bg-[#F0E7A1] text-black text-sm font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending…" : "Submit feedback"}
            </button>
          </form>
        )}
      </Card>

      {/* Contact */}
      <Card>
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">
          Get in touch
        </h3>
        <p className="text-sm text-white/40 leading-relaxed">
          Email us at{" "}
          <span className="text-[#F0E7A1]/70">support@betterwallet.com</span>
          . We typically respond within 24 hours.
        </p>
      </Card>

    </div>
  );
};
