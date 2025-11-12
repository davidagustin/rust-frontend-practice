use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::Response,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::process::Command;
use tokio::time::{interval, timeout, Duration};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CandleData {
    timestamp: u64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: f64,
}

#[derive(Serialize, Deserialize, Debug)]
struct PriceUpdate {
    candles: Vec<CandleData>,
}

async fn fetch_ohlcv_data() -> Result<Vec<CandleData>, Box<dyn std::error::Error>> {
    // Get the script path relative to the project root
    let script_path = PathBuf::from("scripts/fetch_ohlcv.py");
    
    // Wrap command execution with 10-second timeout to prevent hanging
    let output = timeout(
        Duration::from_secs(10),
        Command::new("python3")
            .arg(&script_path)
            .output()
    )
    .await??;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", error).into());
    }

    let json_str = String::from_utf8(output.stdout)?;
    let candles: Vec<CandleData> = serde_json::from_str(&json_str)?;
    Ok(candles)
}

async fn handle_socket(mut socket: WebSocket) {
    // Send connection confirmation immediately (empty data to establish connection)
    let initial_update = PriceUpdate {
        candles: Vec::new(),
    };
    if let Ok(json) = serde_json::to_string(&initial_update) {
        let _ = socket.send(Message::Text(json)).await;
    }

    // Fetch initial data in background (non-blocking)
    let initial_fetch = tokio::spawn(async {
        fetch_ohlcv_data().await
    });

    // Wait for initial fetch with timeout
    match timeout(Duration::from_secs(15), initial_fetch).await {
        Ok(Ok(Ok(candles))) if !candles.is_empty() => {
            let update = PriceUpdate { candles };
            if let Ok(json) = serde_json::to_string(&update) {
                let _ = socket.send(Message::Text(json)).await;
            }
        }
        Ok(Ok(Err(e))) => {
            eprintln!("Error fetching initial data: {}", e);
            // Send error message to client
            let error_update = PriceUpdate {
                candles: Vec::new(),
            };
            if let Ok(json) = serde_json::to_string(&error_update) {
                let _ = socket.send(Message::Text(json)).await;
            }
        }
        Ok(Err(_)) => {
            eprintln!("Initial fetch task failed");
        }
        Err(_) => {
            eprintln!("Initial fetch timed out");
        }
    }

    let mut interval = interval(Duration::from_secs(60)); // Update every minute

    loop {
        tokio::select! {
            _ = interval.tick() => {
                match fetch_ohlcv_data().await {
                    Ok(candles) if !candles.is_empty() => {
                        let update = PriceUpdate { candles };
                        if let Ok(json) = serde_json::to_string(&update) {
                            if socket.send(Message::Text(json)).await.is_err() {
                                break;
                            }
                        }
                    }
                    Ok(_) => {
                        eprintln!("Received empty candle data");
                    }
                    Err(e) => {
                        eprintln!("Error fetching data: {}", e);
                    }
                }
            }
            result = socket.recv() => {
                match result {
                    Some(Ok(Message::Close(_))) => {
                        println!("Client closed connection");
                        break;
                    }
                    Some(Ok(Message::Ping(_))) => {
                        let _ = socket.send(Message::Pong(vec![])).await;
                    }
                    Some(Ok(_)) => {
                        // Handle other messages
                    }
                    Some(Err(e)) => {
                        eprintln!("WebSocket error: {:?}", e);
                        break;
                    }
                    None => {
                        println!("WebSocket stream ended");
                        break;
                    }
                }
            }
        }
    }
    
    println!("WebSocket connection closed");
}

async fn ws_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_socket)
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(tower_http::cors::CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await.unwrap();
    println!("🚀 Rust server running on ws://127.0.0.1:3001/ws");
    println!("📊 Ready to accept WebSocket connections...");
    
    axum::serve(listener, app).await.unwrap();
}

