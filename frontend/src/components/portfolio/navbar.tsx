import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Logo } from "@/components/ui/logo";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useWallet } from "@/hooks/use-wallet";
import { Copy, Check, LogOut } from "lucide-react";

const NavBarPortfolio: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wAddress, walletType } = useWallet();
  const [copied, setCopied] = useState(false);

  const email = auth.currentUser?.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleCopy = () => {
    if (!wAddress) return;
    navigator.clipboard.writeText(wAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`text-sm px-4 py-2 rounded-lg transition-colors ${
          active
            ? "bg-[#F0E7A1]/15 text-[#F0E7A1]"
            : "text-[#F0E7A1]/50 hover:text-[#F0E7A1] hover:bg-[#F0E7A1]/10"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-black border-b border-[#F0E7A1]/10 flex-shrink-0">
      <Link to="/dashboard">
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-1">
        {navLink("/dashboard", "Home")}
        {navLink("/Portfolio", "Portfolio")}
        {navLink("/Explore", "Explore")}
        {navLink("/Transaction", "Transactions")}
      </div>

      <div className="flex items-center gap-3">
        {navLink("/Settings", "Settings")}

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-8 w-8 rounded-full bg-[#F0E7A1] text-black text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#F0E7A1]/40"
              aria-label="Account"
            >
              {initial}
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-72 bg-[#111] border border-[#F0E7A1]/15 rounded-xl p-0 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#F0E7A1]/10">
              <div className="h-10 w-10 rounded-full bg-[#F0E7A1] text-black text-base font-bold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#F0E7A1] font-medium truncate">{email}</p>
                {walletType && (
                  <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[#F0E7A1]/10 text-[#F0E7A1]/50 uppercase tracking-wider">
                    {walletType}
                  </span>
                )}
              </div>
            </div>

            {/* Wallet address */}
            <div className="px-4 py-3 border-b border-[#F0E7A1]/10">
              <p className="text-[10px] text-[#F0E7A1]/30 uppercase tracking-wider mb-2">
                Wallet address
              </p>
              {wAddress ? (
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#F0E7A1]/10 rounded-lg px-3 py-2">
                  <span className="flex-1 text-[11px] font-mono text-[#F0E7A1]/60 break-all leading-relaxed">
                    {wAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1 rounded hover:bg-[#F0E7A1]/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-[#F0E7A1]/30" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="h-8 bg-[#F0E7A1]/5 rounded-lg animate-pulse" />
              )}
              {copied && (
                <p className="text-[10px] text-green-400 mt-1">Copied to clipboard</p>
              )}
            </div>

            {/* Sign out */}
            <div className="px-4 py-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-sm text-[#F0E7A1]/40 hover:text-red-400 transition-colors py-1"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
};

export default NavBarPortfolio;
