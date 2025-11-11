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
use tokio::time::{interval, Duration};

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
    
    let output = Command::new("python3")
        .arg(&script_path)
        .output()
        .await?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python script error: {}", error).into());
    }

    let json_str = String::from_utf8(output.stdout)?;
    let candles: Vec<CandleData> = serde_json::from_str(&json_str)?;
    Ok(candles)
}

async fn handle_socket(mut socket: WebSocket) {
    // Send initial data immediately
    if let Ok(candles) = fetch_ohlcv_data().await {
        let update = PriceUpdate { candles };
        if let Ok(json) = serde_json::to_string(&update) {
            let _ = socket.send(Message::Text(json)).await;
        }
    }

    let mut interval = interval(Duration::from_secs(60)); // Update every minute

    loop {
        tokio::select! {
            _ = interval.tick() => {
                match fetch_ohlcv_data().await {
                    Ok(candles) => {
                        let update = PriceUpdate { candles };
                        if let Ok(json) = serde_json::to_string(&update) {
                            if socket.send(Message::Text(json)).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Error fetching data: {}", e);
                    }
                }
            }
            result = socket.recv() => {
                match result {
                    Some(Ok(Message::Close(_))) => break,
                    Some(Ok(_)) => {
                        // Handle ping/pong or other messages
                    }
                    Some(Err(_)) | None => break,
                }
            }
        }
    }
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
    
    axum::serve(listener, app).await.unwrap();
}

