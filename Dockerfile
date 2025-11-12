# Multi-stage build for smaller image size
FROM rust:1.75-slim as builder

WORKDIR /app

# Copy dependency files
COPY Cargo.toml ./
COPY Cargo.lock* ./

# Create a dummy source file to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release && rm src/main.rs

# Copy actual source code
COPY src ./src
COPY scripts ./scripts

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install Python and required dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/bitcoin-price-server /app/bitcoin-price-server

# Copy Python script
COPY --from=builder /app/scripts /app/scripts

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Expose port (will be set by hosting platform)
EXPOSE 3001

# Run the server
CMD ["./bitcoin-price-server"]

