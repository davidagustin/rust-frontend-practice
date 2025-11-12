# Deployment Guide for Rust Backend

## ⚠️ Important: Vercel Cannot Host Rust WebSocket Servers

**Vercel is NOT suitable for deploying the Rust backend** because:
- Vercel only supports serverless functions (not long-running processes)
- WebSocket connections require persistent connections
- Serverless functions have execution time limits (10-60 seconds)

**Solution**: Deploy the Rust backend to a platform that supports long-running processes, then connect your Vercel frontend to it.

---

## Recommended Deployment Options

### Option 1: Railway (Easiest) ⭐ Recommended

**Pros**: Simple, automatic deployments, free tier available

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: 
   - Select "Deploy from GitHub repo"
   - Choose your `rust-frontend-practice` repository
   - Railway will auto-detect the Dockerfile
4. **Configure**:
   - Railway automatically sets the `PORT` environment variable
   - The service will be available at `https://your-app-name.up.railway.app`
5. **Get WebSocket URL**:
   - Your WebSocket URL will be: `wss://your-app-name.up.railway.app/ws`
   - Note: Railway uses HTTPS, so use `wss://` (secure WebSocket)

**Cost**: Free tier includes $5/month credit

---

### Option 2: Render

**Pros**: Free tier, easy setup, good documentation

1. **Sign up**: Go to [render.com](https://render.com) and sign up
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `rust-frontend-practice` repository
3. **Configure**:
   - **Name**: `bitcoin-price-server`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Region**: Choose closest to you
   - **Instance Type**: Free (or paid for better performance)
4. **Environment Variables**:
   - `PORT`: `10000` (Render's default)
5. **Deploy**: Click "Create Web Service"
6. **Get WebSocket URL**:
   - Your WebSocket URL will be: `wss://bitcoin-price-server.onrender.com/ws`

**Cost**: Free tier available (spins down after 15 min inactivity)

---

### Option 3: Fly.io

**Pros**: Great for Rust, global edge network, generous free tier

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Launch**:
   ```bash
   fly launch
   ```
   - Follow prompts to create app
   - The `fly.toml` file is already configured

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Get WebSocket URL**:
   - Your WebSocket URL will be: `wss://your-app-name.fly.dev/ws`

**Cost**: Free tier includes 3 shared-cpu VMs

---

### Option 4: DigitalOcean App Platform

**Pros**: Reliable, good performance, easy scaling

1. **Sign up**: Go to [digitalocean.com](https://digitalocean.com)
2. **Create App**: 
   - Go to App Platform → Create App
   - Connect GitHub repository
   - Select `rust-frontend-practice`
3. **Configure**:
   - **Type**: Web Service
   - **Build Command**: (auto-detected from Dockerfile)
   - **Run Command**: `./bitcoin-price-server`
   - **Port**: `3001`
4. **Deploy**: Click "Create Resources"
5. **Get WebSocket URL**:
   - Your WebSocket URL will be: `wss://your-app-name.ondigitalocean.app/ws`

**Cost**: Starts at $5/month

---

## After Deploying the Backend

### 1. Update Vercel Frontend Environment Variable

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_WS_URL`
   - **Value**: `wss://your-backend-url.com/ws` (use `wss://` for secure WebSocket)
   - **Environment**: Production, Preview, Development
4. **Redeploy** your Vercel app

### 2. Test the Connection

1. Open your Vercel-deployed frontend
2. Check browser console for WebSocket connection
3. You should see "Connected" status

---

## Local Development

For local development, the backend will automatically use `localhost:3001`:

```bash
# Terminal 1: Start Rust backend
cargo run

# Terminal 2: Start Next.js frontend
npm run dev
```

The frontend will automatically connect to `ws://localhost:3001/ws` when running locally.

---

## Troubleshooting

### WebSocket Connection Fails

1. **Check URL**: Make sure you're using `wss://` (not `ws://`) for production
2. **Check CORS**: The backend has CORS enabled, but verify your frontend domain is allowed
3. **Check Backend Logs**: Look at your hosting platform's logs for errors
4. **Check Python Script**: Ensure the Python script works (it's included in Docker image)

### Backend Not Starting

1. **Check PORT**: Make sure the `PORT` environment variable is set correctly
2. **Check Logs**: Review deployment logs for build errors
3. **Check Dockerfile**: Ensure Dockerfile builds successfully locally:
   ```bash
   docker build -t bitcoin-server .
   docker run -p 3001:3001 bitcoin-server
   ```

### Python Script Errors

The Dockerfile installs Python and CCXT. If you see Python errors:
1. Check that `requirements.txt` is included
2. Verify the Python script path in the Docker image
3. Check backend logs for Python execution errors

---

## Quick Start: Railway (Recommended)

The fastest way to get started:

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Wait for deployment (2-3 minutes)
6. Copy the WebSocket URL (use `wss://` version)
7. Add it to Vercel as `NEXT_PUBLIC_WS_URL`
8. Done! 🎉

---

## Cost Comparison

| Platform | Free Tier | Paid Starting Price | Best For |
|----------|-----------|---------------------|----------|
| Railway | $5/month credit | $5/month | Easiest setup |
| Render | Yes (spins down) | $7/month | Free tier users |
| Fly.io | 3 shared VMs | ~$2/month | Rust developers |
| DigitalOcean | No | $5/month | Production apps |

---

## Need Help?

- Check the backend logs in your hosting platform
- Verify environment variables are set correctly
- Test WebSocket connection using a tool like [WebSocket King](https://websocketking.com/)

