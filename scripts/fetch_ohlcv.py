#!/usr/bin/env python3
"""
Fetch Bitcoin/USDT 1-minute OHLCV data using CCXT
"""
import ccxt
import json
import sys
from datetime import datetime, timedelta

def fetch_ohlcv():
    try:
        # Initialize exchange (using Binance as default)
        exchange = ccxt.binance({
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot'
            }
        })
        
        # Fetch last 100 candles (1-minute timeframe)
        symbol = 'BTC/USDT'
        timeframe = '1m'
        limit = 100
        
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        
        # Convert to JSON format
        candles = []
        for candle in ohlcv:
            candles.append({
                'timestamp': int(candle[0]),
                'open': float(candle[1]),
                'high': float(candle[2]),
                'low': float(candle[3]),
                'close': float(candle[4]),
                'volume': float(candle[5])
            })
        
        # Output as JSON
        print(json.dumps(candles))
        return 0
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(fetch_ohlcv())

