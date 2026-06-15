import { apiFetch } from '@/lib/api';

export const getTransactionHistory = async () => {
  try {
    const res = await apiFetch('/transactions');
    if (!res.ok) {
      console.error('Failed to fetch transactions', res.status);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};
