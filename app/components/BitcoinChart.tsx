'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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

// Binance API response format
interface BinanceKline {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
  6: number; // Close time
}

export default function BitcoinChart() {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch OHLCV data from Binance REST API
  const fetchCandles = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100'
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data: BinanceKline[] = await response.json();

      const formattedCandles: CandleData[] = data.map((kline) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      setCandles(formattedCandles);
      
      // Update current price from latest candle
      if (formattedCandles.length > 0) {
        const latestCandle = formattedCandles[formattedCandles.length - 1];
        setCurrentPrice(latestCandle.close);
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('Error fetching candles:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  // Connect to Binance WebSocket for real-time price updates
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Binance WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.c) {
            // Update current price from ticker
            const newPrice = parseFloat(data.c);
            setCurrentPrice(newPrice);
            
            // Update the latest candle's close price
            setCandles((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                close: newPrice,
              };
              return updated;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        // Don't set error state - REST API will still work
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      // WebSocket is optional - REST API will still work
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchCandles();

    // Set up polling every 60 seconds
    intervalRef.current = setInterval(() => {
      fetchCandles();
    }, 60000);

    // Connect to WebSocket for real-time updates
    connectWebSocket();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchCandles, connectWebSocket]);

  // Memoize time formatting function
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Memoize chart data calculation - only recalculate when candles change
  const chartData = useMemo(() => {
    return candles.map((candle) => ({
      time: formatTime(candle.timestamp),
      timestamp: candle.timestamp,
      price: candle.close,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      volume: candle.volume,
    }));
  }, [candles, formatTime]);

  // Memoize price calculations
  const { priceChange, priceChangePercent } = useMemo(() => {
    if (chartData.length <= 1) {
      return { priceChange: 0, priceChangePercent: '0.00' };
    }
    
    const change = chartData[chartData.length - 1].price - chartData[0].price;
    const changePercent =
      chartData[0].price !== 0
        ? ((change / chartData[0].price) * 100).toFixed(2)
        : '0.00';
    
    return {
      priceChange: change,
      priceChangePercent: changePercent,
    };
  }, [chartData]);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            BTC/USDT
          </h1>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              !error && !isLoading
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}
          >
            {isLoading ? '● Loading...' : error ? '● Error' : '● Live'}
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
          1-minute timeframe • {candles.length} candles • Updates every 60s
        </p>
        {error && (
          <div className="mt-2 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Retrying automatically...
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
                {isLoading ? 'Loading price data from Binance...' : 'No data available'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
