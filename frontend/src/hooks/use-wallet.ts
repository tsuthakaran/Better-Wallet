import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface WalletState {
  balances: Record<string, number>;
  wAddress: string | null;
  walletType: string | null;
  loading: boolean;
}

export function useWallet(): WalletState {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [wAddress, setWAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/wallet/me')
      .then((res) => res.json())
      .then((data) => {
        setBalances(data.listOfCurrencies ?? {});
        setWAddress(data.wAddress ?? null);
        setWalletType(data.walletType ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { balances, wAddress, walletType, loading };
}
