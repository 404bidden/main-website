# API Status Tracker Worker

A Rust-based worker that monitors API endpoints and tracks their status and performance.

## Features

- Fetches active routes from a PostgreSQL database
- Makes HTTP requests to monitor endpoint health
- Supports multiple HTTP methods (GET, POST, PUT, DELETE, etc.)
- Custom request headers and body support
- Response time measurement
- Automatic retry on failure
- Concurrent request processing
- Configurable monitoring intervals
- Logs results to database

## Setup

1. Ensure you have Rust and Cargo installed
2. Build the worker:
    ```
    cd worker
    cargo build --release
    ```

## Running the Worker

```
cd worker
cargo run --release
```

The worker will start monitoring all active routes defined in the database according to their configured monitoring intervals.

## PostgreSQL Schema

The worker expects the database to have the following schema:

- `Route` table: Contains endpoints to monitor
- `RequestLog` table: Stores monitoring results

(See your Prisma schema for detailed structure)
