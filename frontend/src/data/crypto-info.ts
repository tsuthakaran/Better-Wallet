import { CryptoLabel } from '@/types';

export const CryptoLabelsAttributes: CryptoLabel[] = [
  { symbol: 'BTC',  currency: 'USDT', name: 'Bitcoin',           value: 0, change: 0, icon: 'B' },
  { symbol: 'ETH',  currency: 'USDT', name: 'Ethereum',          value: 0, change: 0, icon: 'E' },
  { symbol: 'BNB',  currency: 'USDT', name: 'BNB',               value: 0, change: 0, icon: 'B' },
  { symbol: 'SOL',  currency: 'USDT', name: 'Solana',            value: 0, change: 0, icon: 'S' },
  { symbol: 'XRP',  currency: 'USDT', name: 'XRP',               value: 0, change: 0, icon: 'X' },
  { symbol: 'ADA',  currency: 'USDT', name: 'Cardano',           value: 0, change: 0, icon: 'A' },
  { symbol: 'DOGE', currency: 'USDT', name: 'Dogecoin',          value: 0, change: 0, icon: 'D' },
  { symbol: 'TRX',  currency: 'USDT', name: 'Tron',              value: 0, change: 0, icon: 'T' },
  { symbol: 'TON',  currency: 'USDT', name: 'Toncoin',           value: 0, change: 0, icon: 'T' },
  { symbol: 'AVAX', currency: 'USDT', name: 'Avalanche',         value: 0, change: 0, icon: 'A' },
  { symbol: 'SHIB', currency: 'USDT', name: 'Shiba Inu',         value: 0, change: 0, icon: 'S' },
  { symbol: 'DOT',  currency: 'USDT', name: 'Polkadot',          value: 0, change: 0, icon: 'D' },
  { symbol: 'LINK', currency: 'USDT', name: 'Chainlink',         value: 0, change: 0, icon: 'L' },
  { symbol: 'BCH',  currency: 'USDT', name: 'Bitcoin Cash',      value: 0, change: 0, icon: 'B' },
  { symbol: 'LTC',  currency: 'USDT', name: 'Litecoin',          value: 0, change: 0, icon: 'L' },
  { symbol: 'UNI',  currency: 'USDT', name: 'Uniswap',           value: 0, change: 0, icon: 'U' },
  { symbol: 'ARB',  currency: 'USDT', name: 'Arbitrum',          value: 0, change: 0, icon: 'A' },
  { symbol: 'POL',  currency: 'USDT', name: 'Polygon',           value: 0, change: 0, icon: 'P' },
  { symbol: 'XLM',  currency: 'USDT', name: 'Stellar',           value: 0, change: 0, icon: 'X' },
  { symbol: 'ALGO', currency: 'USDT', name: 'Algorand',          value: 0, change: 0, icon: 'A' },
  { symbol: 'ICP',  currency: 'USDT', name: 'Internet Computer', value: 0, change: 0, icon: 'I' },
];

export interface FiatAsset {
  symbol: string;
  name: string;
  icon: string;
}

export const FiatAssets: FiatAsset[] = [
  { symbol: 'USDT', name: 'Tether',        icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin',      icon: '◎' },
  { symbol: 'USD',  name: 'US Dollar',     icon: '$' },
  { symbol: 'GBP',  name: 'British Pound', icon: '£' },
];
