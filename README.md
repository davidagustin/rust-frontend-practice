# 📈 Bitcoin/USDT Real-Time Price Chart

<div align="center">

**A pure frontend cryptocurrency price tracking application**

Built with ⚛️ React, Next.js, and 📊 Recharts

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black)](https://vercel.com/)

</div>

---

## ✨ Features

- ⚡ **Pure Frontend** - No backend required, runs entirely on Vercel
- 🔄 **Real-Time Updates** - Binance WebSocket stream for live price updates
- 📊 **Beautiful Charts** - Interactive candlestick visualization with Recharts
- 🎨 **Modern UI** - Responsive design with dark mode support
- 📈 **Price Analytics** - Real-time price change tracking with percentage calculations
- 🚀 **Zero Configuration** - Works out of the box on Vercel

## 🏗️ Architecture

```
┌─────────────┐
│   React     │
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├──► Binance REST API (Historical Data)
       │    https://api.binance.com/api/v3/klines
       │
       └──► Binance WebSocket (Real-Time Updates)
            wss://stream.binance.com:9443/ws/btcusdt@ticker
```

### Key Components

- **Frontend (React)**: Next.js application with client-side data fetching
- **Data Fetching**: Direct Binance REST API calls for historical OHLCV data
- **Real-Time Updates**: Binance WebSocket stream for live price ticker
- **Polling**: Automatic refresh every 60 seconds for new candles

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm - [Install Node.js](https://nodejs.org/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rust-frontend-practice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! No backend setup required. 🎉

## 📖 How It Works

### Data Flow

1. **Initial Load**: Fetches last 100 candles (1-minute timeframe) from Binance REST API
2. **Real-Time Updates**: Connects to Binance WebSocket stream for live price ticker
3. **Periodic Refresh**: Polls Binance API every 60 seconds for new candle data
4. **Chart Rendering**: React components use memoization to efficiently update only when data changes

### Performance Optimizations

- ✅ **Direct API Calls**: No backend overhead, direct connection to Binance
- ✅ **Memoization**: Frontend only recalculates when data actually changes
- ✅ **WebSocket Streaming**: Real-time price updates without polling overhead
- ✅ **Efficient Updates**: Only updates changed data, not full re-renders

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in
3. **Import Project**: Click "Add New Project" → Import your GitHub repository
4. **Configure**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
5. **Deploy**: Click "Deploy"
6. **Done!** Your app will be live in ~2 minutes

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

## 📁 Project Structure

```
rust-frontend-practice/
├── app/
│   ├── components/
│   │   └── BitcoinChart.tsx    # Main chart component
│   ├── page.tsx                # Main page
│   ├── layout.tsx               # Root layout
│   └── globals.css             # Global styles
├── package.json                # Node.js dependencies
├── next.config.ts              # Next.js configuration
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### Data Sources
- **[Binance REST API](https://binance-docs.github.io/apidocs/spot/en/)** - Historical OHLCV data
- **[Binance WebSocket Stream](https://binance-docs.github.io/apidocs/spot/en/websocket-api)** - Real-time price updates

## 🎯 Usage

Once deployed or running locally:

1. **View Real-Time Chart**: The chart displays the last 100 candles (1-minute timeframe)
2. **Monitor Live Price**: Current price updates in real-time via WebSocket
3. **Track Price Changes**: See real-time price changes with percentage calculations
4. **Automatic Updates**: Chart refreshes automatically every 60 seconds

## 🔧 Configuration

### Customization Options

Edit `app/components/BitcoinChart.tsx` to customize:

- **Update Interval**: Change `60000` (60 seconds) to adjust polling frequency
- **Candle Limit**: Update Binance API `limit` parameter (default: 100)
- **Symbol**: Change `BTCUSDT` to track other trading pairs
- **Timeframe**: Modify `interval=1m` for different timeframes (1m, 5m, 1h, etc.)
- **Chart Styling**: Modify Recharts components for visual customization

## 🐛 Troubleshooting

### Chart Not Loading

- ✅ Check browser console for CORS errors (shouldn't happen with Binance API)
- ✅ Verify internet connection
- ✅ Check if Binance API is accessible (no network restrictions)

### Price Not Updating

- ✅ Check browser console for WebSocket connection errors
- ✅ Verify Binance WebSocket is accessible
- ✅ Check network tab for API call failures

### Build Errors on Vercel

- ✅ Ensure Node.js version is 18+ in Vercel settings
- ✅ Check that all dependencies are in `package.json`
- ✅ Verify `next.config.ts` is properly configured

## 📝 API Rate Limits

Binance API has rate limits:
- **REST API**: 1200 requests per minute per IP
- **WebSocket**: No rate limits (streaming)

The app respects these limits by:
- Polling REST API only once per minute
- Using WebSocket for real-time updates (no polling needed)

## 🚧 Future Enhancements

- [ ] Multiple cryptocurrency pairs support
- [ ] Different timeframe options (5m, 15m, 1h, 4h, 1d)
- [ ] Historical data storage (localStorage)
- [ ] Price alerts
- [ ] Technical indicators overlay
- [ ] Volume analysis

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or issues, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ using React and Next.js**

⭐ Star this repo if you find it helpful!

**Deploy instantly to Vercel** - [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

</div>
