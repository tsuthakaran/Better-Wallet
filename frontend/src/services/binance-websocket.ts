// binance-websocket.ts
import { PriceData } from "@/types";

class BinanceWebSocketManager {
  private activeConnections: Map<string, WebSocket> = new Map();
  private dataStreams: Map<string, PriceData[]> = new Map();
  private subscribers: Map<string, ((data: PriceData) => void)[]> = new Map();
  private maxDataPoints = 10000;

  // Establish a real-time data stream for a specific cryptocurrency
  public subscribeToRealTimeData(symbol: string, callback: (data: PriceData) => void) {
    const normalizedSymbol = symbol.toUpperCase();
    const streamKey = `${normalizedSymbol}USDT`;

    // Initialize data storage if it doesn't exist
    if (!this.dataStreams.has(streamKey)) {
      this.dataStreams.set(streamKey, []);
    }

    // Add callback to subscribers
    if (!this.subscribers.has(streamKey)) {
      this.subscribers.set(streamKey, []);
    }
    this.subscribers.get(streamKey)?.push(callback);

    // Create new WebSocket connection if one doesn't exist
    if (!this.activeConnections.has(streamKey)) {
      this.createNewConnection(streamKey);
    }

    // Return unsubscribe function
    return () => this.unsubscribeFromRealTimeData(streamKey, callback);
  }

  // Create a new WebSocket connection for a specific trading pair
  private createNewConnection(streamKey: string) {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamKey.toLowerCase()}@trade`);

    ws.onmessage = (event) => this.handleIncomingData(streamKey, event);
    ws.onerror = (error) => console.error(`WebSocket error for ${streamKey}:`, error);
    ws.onclose = () => {
      this.activeConnections.delete(streamKey);
      console.log(`WebSocket connection closed for ${streamKey}`);
    };

    this.activeConnections.set(streamKey, ws);
  }

  // Process incoming WebSocket data
  private handleIncomingData(streamKey: string, event: MessageEvent) {
    const data = JSON.parse(event.data);
    const priceData: PriceData = {
      timeStamp: new Date(data.E).toISOString(),
      price: parseFloat(data.p)
    };

    // Update data stream
    const dataStream = this.dataStreams.get(streamKey) || [];
    if (dataStream.length >= this.maxDataPoints) {
      dataStream.shift();
    }
    dataStream.push(priceData);
    this.dataStreams.set(streamKey, dataStream);

    // Notify subscribers
    const subscribers = this.subscribers.get(streamKey) || [];
    subscribers.forEach(callback => callback(priceData));
  }

  // Unsubscribe from a data stream
  private unsubscribeFromRealTimeData(streamKey: string, callback: (data: PriceData) => void) {
    const subscribers = this.subscribers.get(streamKey);
    if (!subscribers) return;

    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }

    // Close connection if no more subscribers
    if (subscribers.length === 0) {
      this.subscribers.delete(streamKey);
      const ws = this.activeConnections.get(streamKey);
      if (ws) {
        ws.close();
        this.activeConnections.delete(streamKey);
      }
    }
  }

  // Get historical data for a specific cryptocurrency
  public getHistoricalData(symbol: string): PriceData[] {
    const streamKey = `${symbol.toUpperCase()}USDT`;
    return this.dataStreams.get(streamKey) || [];
  }

  // Close all active connections
  public closeAllConnections() {
    this.activeConnections.forEach(ws => ws.close());
    this.activeConnections.clear();
    this.subscribers.clear();
  }
}

// Export a single instance (singleton pattern optional)
export const binanceWebSocketManager = new BinanceWebSocketManager();