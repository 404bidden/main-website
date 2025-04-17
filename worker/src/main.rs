use std::time::{Duration, Instant};
use std::collections::HashMap;
use dotenv::dotenv;
use reqwest::{Client, Method, header::HeaderMap};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use tokio::time;
use uuid::Uuid;
use anyhow::{Result, Context};
use std::fmt;

#[derive(Debug, Deserialize, Clone)]
struct Route {
    id: String,
    name: String,
    url: String,
    method: String,
    #[serde(rename = "requestHeaders")]
    request_headers: Option<serde_json::Value>,
    #[serde(rename = "requestBody")]
    request_body: Option<String>,
    #[serde(rename = "expectedStatusCode")]
    expected_status_code: Option<i32>,
    #[serde(rename = "responseTimeThreshold")]
    response_time_threshold: Option<i32>,
    #[serde(rename = "monitoringInterval")]
    monitoring_interval: i32,
    retries: Option<i32>,
    #[serde(rename = "alertEmail")]
    alert_email: Option<String>,
    #[serde(rename = "isActive")]
    is_active: bool,
}

#[derive(Debug, Serialize, Clone)]
struct RequestLog {
    id: String,
    #[serde(rename = "statusCode")]
    status_code: Option<i32>,
    #[serde(rename = "responseTime")]
    response_time: Option<i32>,
    #[serde(rename = "isSuccess")]
    is_success: bool,
    #[serde(rename = "routeId")]
    route_id: String,
}

async fn fetch_active_routes(pool: &PgPool) -> Result<Vec<Route>> {
    println!("Fetching active routes from database...");
    let routes = sqlx::query(
        r#"
        SELECT 
            id, 
            name, 
            url, 
            method,
            "requestHeaders",
            "requestBody",
            "expectedStatusCode",
            "responseTimeThreshold",
            "monitoringInterval",
            retries,
            "alertEmail",
            "isActive"
        FROM "Route"
        WHERE "isActive" = true
        "#
    )
    .map(|row: sqlx::postgres::PgRow| {
        Route {
            id: row.get("id"),
            name: row.get("name"),
            url: row.get("url"),
            method: row.get("method"),
            request_headers: row.get("requestHeaders"),
            request_body: row.get("requestBody"),
            expected_status_code: row.get("expectedStatusCode"),
            response_time_threshold: row.get("responseTimeThreshold"),
            monitoring_interval: row.get("monitoringInterval"),
            retries: row.get("retries"),
            alert_email: row.get("alertEmail"),
            is_active: row.get("isActive"),
        }
    })
    .fetch_all(pool)
    .await
    .context("Failed to fetch active routes")?;

    println!("✅ Found {} active routes to monitor", routes.len());
    for route in &routes {
        println!("  • [{}] {} → {} {}", route.id, route.name, route.method, route.url);
    }

    Ok(routes)
}

async fn insert_request_log(pool: &PgPool, log: &RequestLog) -> Result<()> {
    println!("Saving log for route {}... (Status: {}, Success: {}, Time: {}ms)", 
        log.route_id, 
        log.status_code.map_or("N/A".to_string(), |s| s.to_string()), 
        log.is_success,
        log.response_time.map_or("N/A".to_string(), |t| t.to_string())
    );
    
    sqlx::query(
        r#"
        INSERT INTO "RequestLog" (id, "statusCode", "responseTime", "isSuccess", "routeId", "createdAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        "#
    )
    .bind(&log.id)
    .bind(log.status_code)
    .bind(log.response_time)
    .bind(log.is_success)
    .bind(&log.route_id)
    .execute(pool)
    .await
    .context("Failed to insert request log")?;

    println!("✅ Log saved to database");
    Ok(())
}

async fn check_route(client: &Client, route: &Route, pool: &PgPool) -> Result<()> {
    println!("\n📤 Checking route: {} ({})", route.name, route.url);
    
    let method = match route.method.to_uppercase().as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        "PUT" => Method::PUT,
        "DELETE" => Method::DELETE,
        "PATCH" => Method::PATCH,
        "HEAD" => Method::HEAD,
        "OPTIONS" => Method::OPTIONS,
        _ => Method::GET,
    };

    let mut headers = HeaderMap::new();
    if let Some(request_headers) = &route.request_headers {
        if let serde_json::Value::Object(map) = request_headers {
            for (key, value) in map {
                if let Some(value_str) = value.as_str() {
                    if let Ok(header_value) = reqwest::header::HeaderValue::from_str(value_str) {
                        headers.insert(
                            reqwest::header::HeaderName::from_bytes(key.as_bytes())
                                .unwrap_or_else(|_| reqwest::header::HeaderName::from_static("x-custom")),
                            header_value,
                        );
                    }
                }
            }
        }
    }

    let body = route.request_body.clone();
    if let Some(body_text) = &body {
        println!("  With body: {}", if body_text.len() > 100 { 
            format!("{}... (truncated)", &body_text[..100]) 
        } else { 
            body_text.clone() 
        });
    }

    let start = Instant::now();
    let mut is_success = false;
    let mut status_code = None;
    let retry_count = route.retries.unwrap_or(0);

    for attempt in 0..=retry_count {
        if attempt > 0 {
            println!("  🔄 Retry attempt {} of {}", attempt, retry_count);
        }
        
        let mut request_builder = client.request(method.clone(), &route.url).headers(headers.clone());
        
        if let Some(body_text) = &body {
            request_builder = request_builder.body(body_text.clone());
        }
        
        println!("  📡 Sending {} request to {}", method, route.url);
        match request_builder.send().await {
            Ok(response) => {
                let status = response.status().as_u16() as i32;
                status_code = Some(status);
                let elapsed = start.elapsed().as_millis() as i32;

                println!("  📥 Response received: HTTP {} ({} ms)", status, elapsed);

                if let Some(expected) = route.expected_status_code {
                    is_success = status == expected;
                    if is_success {
                        println!("  ✅ Status code {} matches expected {}", status, expected);
                    } else {
                        println!("  ❌ Status code {} does not match expected {}", status, expected);
                    }
                } else {
                    is_success = response.status().is_success();
                    if is_success {
                        println!("  ✅ Status code {} indicates success", status);
                    } else {
                        println!("  ❌ Status code {} indicates failure", status);
                    }
                }

                if is_success {
                    break;
                } else if attempt < retry_count {
                    println!("  ⏱️ Waiting 500ms before retry");
                    time::sleep(Duration::from_millis(500)).await;
                }
            }
            Err(err) => {
                println!("  ❌ Request failed: {}", err);
                if attempt < retry_count {
                    println!("  ⏱️ Waiting 500ms before retry");
                    time::sleep(Duration::from_millis(500)).await;
                }
            }
        }
    }

    let duration = start.elapsed();
    let response_time = duration.as_millis() as i32;

    if let Some(threshold) = route.response_time_threshold {
        if response_time > threshold {
            println!("  ⚠️ Response time {}ms exceeds threshold {}ms", response_time, threshold);
            is_success = false;
        } else {
            println!("  ✅ Response time {}ms is within threshold {}ms", response_time, threshold);
        }
    } else {
        println!("  ℹ️ Response time: {}ms (no threshold set)", response_time);
    }

    let log = RequestLog {
        id: Uuid::new_v4().to_string(),
        status_code,
        response_time: Some(response_time),
        is_success,
        route_id: route.id.clone(),
    };

    insert_request_log(pool, &log).await?;

    println!("🏁 Finished checking route: {} (Success: {})", route.name, is_success);
    Ok(())
}

async fn monitor_routes(pool: &PgPool) -> Result<()> {
    println!("Creating HTTP client...");
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .context("Failed to create HTTP client")?;
    println!("✅ HTTP client created");

    let routes = fetch_active_routes(pool).await?;
    
    let mut routes_by_interval: HashMap<i32, Vec<Route>> = HashMap::new();
    for route in routes {
        routes_by_interval
            .entry(route.monitoring_interval)
            .or_default()
            .push(route);
    }

    println!("\n🔍 Monitoring routes with the following intervals:");
    for (interval, routes) in &routes_by_interval {
        println!("  • Every {} seconds: {} routes", interval, routes.len());
    }

    let mut handles = Vec::new();
    for (interval, routes) in routes_by_interval {
        let pool_clone = pool.clone();
        let client_clone = client.clone();
        let routes_clone = routes.clone();

        let handle = tokio::spawn(async move {
            let interval_duration = Duration::from_secs(interval as u64);
            let mut interval_timer = time::interval(interval_duration);
            println!("⏰ Starting monitoring task for {} second interval", interval);

            loop {
                interval_timer.tick().await;
                println!("\n⏰ Running checks for {} second interval...", interval);
                
                let futures = routes_clone.iter().map(|route| {
                    let client = client_clone.clone();
                    let pool = pool_clone.clone();
                    async move {
                        if let Err(e) = check_route(&client, route, &pool).await {
                            eprintln!("❌ Error checking route {}: {:?}", route.name, e);
                        }
                    }
                });

                println!("🔄 Running {} concurrent checks...", routes_clone.len());
                futures_util::future::join_all(futures).await;
                println!("✅ Completed all checks for {} second interval", interval);
            }
        });

        handles.push(handle);
    }

    println!("\n🚀 All monitoring tasks started!");
    
    for handle in handles {
        if let Err(e) = handle.await {
            eprintln!("❌ Task failed: {:?}", e);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    
    println!("🔐 Loading environment variables...");
    let database_url = std::env::var("DATABASE_URL")
        .context("DATABASE_URL environment variable not set")?;
    println!("✅ Environment variables loaded");
    
    println!("🔌 Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .context("Failed to connect to the database")?;
    println!("✅ Connected to database");

    println!("\n🚀 Starting API status tracker worker...");
    
    monitor_routes(&pool).await?;
    
    Ok(())
}