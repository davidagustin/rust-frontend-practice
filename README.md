# Bitcoin/USDT Real-Time Price Chart

A real-time Bitcoin/USDT price chart application built with Rust, CCXT (Python), and React (Next.js). The application displays 1-minute timeframe OHLCV data with efficient WebSocket updates.

## Architecture

- **Backend**: Rust server using Axum for WebSocket communication
- **Data Fetching**: Python script using CCXT library to fetch cryptocurrency data from Binance
- **Frontend**: React (Next.js) with Recharts for visualization
- **Communication**: WebSocket for real-time data streaming

## Prerequisites

- Rust (latest stable version)
- Python 3.8+
- Node.js 18+ and npm
- Cargo (Rust package manager)

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Build and Run the Rust Backend

In one terminal window:

```bash
cargo run
```

The Rust server will start on `ws://localhost:3001/ws`

### 4. Run the Next.js Frontend

In another terminal window:

```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

## How It Works

1. The Rust backend spawns a Python process that uses CCXT to fetch Bitcoin/USDT 1-minute OHLCV data from Binance
2. The backend maintains WebSocket connections and sends updates every 60 seconds
3. The React frontend connects to the WebSocket and displays the data in a real-time chart
4. The chart automatically updates with new price data and shows connection status

## Features

- Real-time price updates every minute
- Beautiful, responsive chart visualization
- Connection status indicator
- Price change percentage display
- Automatic reconnection on disconnect
- Dark mode support

## Project Structure

```
.
├── src/
│   └── main.rs              # Rust backend server
├── scripts/
│   └── fetch_ohlcv.py      # Python script using CCXT
├── app/
│   ├── components/
│   │   └── BitcoinChart.tsx # React chart component
│   └── page.tsx             # Main page
├── Cargo.toml               # Rust dependencies
├── requirements.txt         # Python dependencies
└── package.json             # Node.js dependencies
```

## Troubleshooting

- **WebSocket connection fails**: Make sure the Rust backend is running on port 3001
- **Python script errors**: Ensure CCXT is installed (`pip install -r requirements.txt`)
- **Chart not updating**: Check browser console for WebSocket errors
