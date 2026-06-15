/* eslint-disable @typescript-eslint/no-unused-vars */
import { HistoricalQueue, PriceData } from "@/types";
import { Kline, TimeRange, TimeRangeContextType } from "@/types";
import { useState, createContext, useContext, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { TIME_RANGE_CONFIG } from "@/components/portfolio/main/price-graph-config";
import { binanceWebSocketManager } from "@/services/binance-websocket";


// Binance API configuration
const BINANCE_API = 'https://api.binance.com/api/v3';

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined);


export const TimeRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimePrice, setRealTimePrice] = useState<number | null>(null);
  const bufferRef = useRef<{ price: number; timeStamp: string }[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<() => void | null>(null);
  const historicalQueueRef = useRef<HistoricalQueue>({ data: [], maxLength: 0 });
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [quoteAsset, setQuoteAsset] = useState<string>('USDT'); // Add quote asset state

  // Memoize the current configuration
  const currentConfig = useMemo(() => TIME_RANGE_CONFIG[timeRange], [timeRange]);


  const intervalToMilliseconds = useCallback((interval: string): number => {
    const numeric = parseInt(interval.match(/\d+/)?.[0] || '1');
    const unit = interval.match(/[mhdw]/)?.[0] as 'm' | 'h' | 'd' | 'w' | undefined;
    
    const multipliers = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };
    
    return numeric * (unit ? multipliers[unit] : 60 * 1000);
  }, []);

  const getRealTimePrice = useCallback(() => {
    // Clean up previous subscription if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
  
    // Subscribe to real-time updates for selected crypto
    const symbol = selectedCrypto === 'TOTAL' ? 'BTC' : selectedCrypto; // Adjust for portfolio view
  
    unsubscribeRef.current = binanceWebSocketManager.subscribeToRealTimeData(
      symbol,
      (data: PriceData) => {
        setRealTimePrice(data.price);
      

      }
    );
  
    // Initialize with existing WebSocket data if available
    const initialData = binanceWebSocketManager.getHistoricalData(symbol);
    if (initialData.length > 0) {
      setRealTimePrice(initialData[initialData.length - 1].price);
    }
  
    // Return cleanup function
    return unsubscribeRef.current;
  }, [selectedCrypto, timeRange]);

  // Enhanced fetchHistoricalData with quote asset support
  const fetchHistoricalData = useCallback(async (range: TimeRange, symbol: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const config = TIME_RANGE_CONFIG[range];
      const tradingPair = `${symbol}${quoteAsset}`;
      const now = Date.now();
      const startTime = now - config.duration;

      const response = await axios.get(`${BINANCE_API}/klines`, {
        params: {
          symbol: tradingPair,
          interval: config.interval,
          limit: config.limit,
          startTime
        }
      });

      const formattedData: PriceData[] = response.data.map((kline: Kline) => ({
        timeStamp: new Date(kline[0]).toISOString(),
        price: parseFloat(kline[4])
      }));

      // Initialize queue with historical data
      historicalQueueRef.current = {
        data: formattedData,
        maxLength: Math.ceil(config.duration / intervalToMilliseconds(config.interval))
      };
      
      setHistoricalData(formattedData);
    } catch (error) {
      console.error('Error fetching Binance data:', error);
      setError('Failed to fetch historical data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [quoteAsset, intervalToMilliseconds]);
  //sets the historical data when the time range or selected crypto changes

  useEffect(() => {
    const config = TIME_RANGE_CONFIG[timeRange];
    historicalQueueRef.current = {
      data: [],
      maxLength: Math.ceil(config.duration / intervalToMilliseconds(config.interval))
    };
  }, [timeRange]);
  
  // Handle time range and crypto selection changes
  useEffect(() => {
    fetchHistoricalData(timeRange, selectedCrypto);
  
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [timeRange, selectedCrypto, fetchHistoricalData]);

  // Update buffer with real-time data
  useEffect(() => {
    if (!realTimePrice) return;

    const now = new Date().toISOString();
    bufferRef.current.push({ price: realTimePrice, timeStamp: now });

    // Keep only the last 100 data points
    if (bufferRef.current.length > 100) {
      bufferRef.current.shift();
    }

    // Update historical data with new real-time data
    setHistoricalData(prev => {
      const newData = [...prev];
      const lastIndex = newData.length - 1;
      
      if (lastIndex >= 0) {
        newData[lastIndex] = { ...newData[lastIndex], price: realTimePrice };
      }
      
      return newData;
    });
  }, [realTimePrice]);

  // Update the useEffect for handling real-time data
useEffect(() => {
  const cleanup = getRealTimePrice();

  return () => {
    if (cleanup) cleanup();
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };
}, [getRealTimePrice]);

  useEffect(() => {
    const fetchDataAndSubscribe = async () => {
      try {
        await fetchHistoricalData(timeRange, selectedCrypto);
        getRealTimePrice();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    fetchDataAndSubscribe();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [timeRange, selectedCrypto, quoteAsset, fetchHistoricalData, getRealTimePrice]);

 // Enhanced yAxis domain calculation
 const yAxisDomain = useMemo(() => {
  if (historicalData.length === 0) return [0, 0];
  
  const prices = historicalData.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Add 1% padding to the y-axis domain
  const padding = (max - min) * 0.01;
  return [
    Math.max(0, min - padding), // Don't go below 0
    max + padding
  ];
}, [historicalData]);

  const value = {
    timeRange,
    setTimeRange,
    historicalData,
    realTimePrice,
    selectedCrypto,
    setSelectedCrypto,
    isLoading,
    error,
    currentConfig,
    quoteAsset,
    setQuoteAsset,
    yAxisDomain,
  };

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  );
};

export const useTimeRangeContext = () => {
  const context = useContext(TimeRangeContext);
  if (!context) throw new Error('useTimeRangeContext must be used within TimeRangeProvider');
  return context;
};