'use client';

import { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceUpdate {
  candles: CandleData[];
}

export default function BitcoinChart() {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const connectWebSocket = () => {
    try {
      // Use environment variable for WebSocket URL, fallback to localhost for local development
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
        (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'ws://localhost:3001/ws' 
          : null);
      
      if (!wsUrl) {
        const errorMsg = 'WebSocket URL not configured. Set NEXT_PUBLIC_WS_URL environment variable or deploy the Rust backend.';
        console.warn(errorMsg);
        setWsError(errorMsg);
        setIsConnected(false);
        return;
      }
      
      setWsError(null);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const update: PriceUpdate = JSON.parse(event.data);
          if (update.candles && update.candles.length > 0) {
            setCandles(update.candles);
            // Set current price to the latest close price
            const latestCandle = update.candles[update.candles.length - 1];
            setCurrentPrice(latestCandle.close);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsError('Failed to connect to WebSocket server. Make sure the Rust backend is running.');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Prepare data for the chart
  const chartData = candles.map((candle) => ({
    time: formatTime(candle.timestamp),
    timestamp: candle.timestamp,
    price: candle.close,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    volume: candle.volume,
  }));

  const priceChange =
    chartData.length > 1
      ? chartData[chartData.length - 1].price - chartData[0].price
      : 0;
  const priceChangePercent =
    chartData.length > 1 && chartData[0].price !== 0
      ? ((priceChange / chartData[0].price) * 100).toFixed(2)
      : '0.00';

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            BTC/USDT
          </h1>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {isConnected ? '● Connected' : '● Disconnected'}
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          {currentPrice !== null && (
            <span className="text-4xl font-bold text-black dark:text-zinc-50">
              ${currentPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          {priceChange !== 0 && (
            <span
              className={`text-xl font-semibold ${
                priceChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)} ({priceChangePercent}%)
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          1-minute timeframe • {candles.length} candles
        </p>
        {wsError && (
          <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Backend not available:</strong> {wsError}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              For production, deploy the Rust backend and set NEXT_PUBLIC_WS_URL environment variable in Vercel.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-zinc-700"
              />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                className="dark:stroke-zinc-400"
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#6b7280"
                className="dark:stroke-zinc-400"
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  'Price',
                ]}
                labelStyle={{ color: '#374151' }}
              />
              <ReferenceLine
                y={currentPrice || 0}
                stroke="#3b82f6"
                strokeDasharray="2 2"
                label={{ value: 'Current', position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-zinc-600 dark:text-zinc-400">
                {isConnected
                  ? 'Loading price data...'
                  : 'Connecting to server...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

