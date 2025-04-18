import { requestLog, routes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { filterSensitiveHeaders, validateUrlSecurity } from "@/lib/security";
import { eq, type InferModel } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// Define types for models
type RouteModel = InferModel<typeof routes>;
type LogModel = InferModel<typeof requestLog>;

export const GET = async (req: NextRequest) => {
    // Route responsible for getting all the users routes
    const session = await auth.api.getSession({
        headers: req.headers,
    });

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;
    // Fetch user routes
    const routesData: RouteModel[] = await db.select().from(routes).where(eq(routes.userId, user.id));

    // Fetch logs for each route
    const routesWithLogs: { route: RouteModel; logs: LogModel[] }[] = await Promise.all(routesData.map(async (route: RouteModel) => {
        const logs: LogModel[] = await db.select().from(requestLog)
            .where(eq(requestLog.routeId, route.id))
            .orderBy(requestLog.createdAt, 'desc')
            .limit(100);
        return { route, logs };
    }));

    // Enhance the route data with metrics
    const routesWithMetrics = routesWithLogs.map(({ route, logs }: { route: RouteModel; logs: LogModel[] }) => {
        const lastLog = logs.length > 0 ? logs[0] : null;

        // Calculate more detailed metrics
        const totalRequests = logs.length;
        const successfulRequests = logs.filter((log: LogModel) => log.isSuccess).length;
        const uptimePercentage =
            totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

        // Calculate status based on uptime percentage and other factors
        let status = "Not monitored";
        if (lastLog) {
            // First check if we even have any logs
            if (totalRequests === 0) {
                status = "Not monitored";
            } else if (
                lastLog.responseTime === undefined ||
                !lastLog.isSuccess
            ) {
                // The last check failed completely
                status = "down";
            } else {
                // Check for latency issues
                const hasLatencySpike =
                    lastLog.responseTime && route.responseTimeThreshold
                        ? lastLog.responseTime > route.responseTimeThreshold
                        : false;

                // Check recent uptime trend (last 5 logs if available)
                const recentLogs: LogModel[] = logs.slice(0, 5);
                const recentFailures = recentLogs.filter((log: LogModel) => !log.isSuccess).length;
                const hasRecentIssues = recentFailures > 0;

                // Apply consistent status determination for all domains
                if (uptimePercentage >= 98) {
                    // For high uptime, only mark as degraded if there's a latency spike
                    status = hasLatencySpike ? "degraded" : "up";
                } else if (uptimePercentage >= 90) {
                    // Between 90-98% uptime, check if there were recent issues
                    status = hasRecentIssues ? "degraded" : "up";
                } else if (uptimePercentage >= 75) {
                    status = "degraded";
                } else {
                    status = "down";
                }
            }
        }

        // Calculate average response time
        const avgResponseTime = totalRequests > 0 ? logs.reduce((sum: number, log: LogModel) => {
            // Convert from seconds to milliseconds if the value is small (older records)
            const responseTime = log.responseTime || 0;
            return (
                sum +
                (responseTime < 10
                    ? responseTime * 1000
                    : responseTime)
            );
        }, 0) / totalRequests : 0;

        // Calculate recent metrics (last 24h if available)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs24h: LogModel[] = logs.filter((log: LogModel) => log.createdAt && new Date(log.createdAt) >= twentyFourHoursAgo);
        const recentUptime = recentLogs24h.length > 0 ? (recentLogs24h.filter((log: LogModel) => log.isSuccess).length / recentLogs24h.length) * 100 : uptimePercentage;

        return {
            id: route.id,
            name: route.name,
            url: route.url,
            method: route.method,
            status,
            statusCode: lastLog?.statusCode,
            responseTime:
                lastLog?.responseTime !== undefined
                    ? lastLog.responseTime
                    : Math.round(avgResponseTime),
            avgResponseTime: Math.round(avgResponseTime),
            lastChecked: lastLog?.createdAt || null,
            uptime: uptimePercentage.toFixed(2) + "%",
            recentUptime: recentUptime.toFixed(2) + "%",
            totalChecks: totalRequests,
            expectedStatusCode: route.expectedStatusCode,
            description: route.description,
            isActive: route.isActive,
            monitoringInterval: route.monitoringInterval,
        };
    });

    return new Response(JSON.stringify(routesWithMetrics), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};

export const POST = async (req: NextRequest) => {
    // Route responsible for creating a new route
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }
    const { user } = session;
    const body = await req.json();
    const {
        name, // Name of the route.
        description, // Description of the route.
        method, // HTTP method (GET, POST, etc.).
        url, // URL of the route to be monitored.
        headers: requestHeaders, // Headers to be sent with the request.
        body: requestBody, // Body of the request (for POST, PUT, etc.).
        expectedStatusCode, // The expected HTTP status code from the route.
        responseTimeThreshold, // Maximum acceptable response time (ms).
        monitoringInterval, // Interval for checking the route (seconds).
        retries, // Number of retry attempts on failure.
        alertEmail, // Email for sending alerts if the check fails.
        testOnly, // If true, only test the route without saving it
        contentType, // Content-Type header for the request
    } = body;

    // Validate required fields
    if (!url || !method) {
        return new Response(
            JSON.stringify({ error: "URL and Method are required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // If testOnly flag is set, we'll just test the route without saving it
    if (testOnly) {
        try {
            // Validate URL security using our helper function
            const securityCheck = validateUrlSecurity(url);
            if (!securityCheck.isValid) {
                return new Response(
                    JSON.stringify({
                        error: securityCheck.error,
                    }),
                    {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            const targetUrl = new URL(url);

            // Prepare headers for the request
            const headers: Record<string, string> = {};

            if (requestHeaders) {
                const parsedHeaders =
                    typeof requestHeaders === "string"
                        ? JSON.parse(requestHeaders)
                        : requestHeaders;

                // Use our helper function to filter sensitive headers
                Object.assign(headers, filterSensitiveHeaders(parsedHeaders));
            }

            // Set content type header based on provided contentType
            if (method !== "GET" && contentType) {
                headers["Content-Type"] = contentType;
            } else if (method !== "GET") {
                headers["Content-Type"] = "application/json";
            }

            // Prepare request options
            const requestOptions: RequestInit = {
                method,
                headers,
                redirect: "follow",
            };

            // Add body for non-GET requests if provided
            if (method !== "GET" && requestBody) {
                if (contentType === "application/json" || !contentType) {
                    try {
                        // If it's already a string, parse it to validate it's JSON, then stringify again
                        const parsedBody =
                            typeof requestBody === "string"
                                ? JSON.parse(requestBody)
                                : requestBody;
                        requestOptions.body = JSON.stringify(parsedBody);
                    } catch (e) {
                        return new Response(
                            JSON.stringify({
                                error: "Invalid JSON in request body",
                            }),
                            {
                                status: 400,
                                headers: { "Content-Type": "application/json" },
                            },
                        );
                    }
                } else {
                    // For non-JSON content types, use as is
                    requestOptions.body =
                        typeof requestBody === "string"
                            ? requestBody
                            : JSON.stringify(requestBody);
                }
            }

            // Measure response time
            const startTime = performance.now();

            // Make the actual request
            const response = await fetch(targetUrl, requestOptions);

            const responseTime = performance.now() - startTime;
            const responseTimeInMs = Math.round(responseTime);

            // Determine if the test passed based on expected status and response time
            const statusMatch = response.status === (expectedStatusCode || 200);
            const timeWithinThreshold =
                !responseTimeThreshold ||
                responseTimeInMs <= responseTimeThreshold;
            const success = statusMatch && timeWithinThreshold;

            // Return test results
            return new Response(
                JSON.stringify({
                    success,
                    url,
                    method,
                    statusCode: response.status,
                    expectedStatusCode: expectedStatusCode || 200,
                    responseTime: responseTimeInMs,
                    responseTimeThreshold,
                    statusMatch,
                    timeWithinThreshold,
                    timestamp: new Date().toISOString(),
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            );
        } catch (error: unknown) {
            // Handle any errors during testing
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";

            return new Response(
                JSON.stringify({
                    error: `Failed to test route: ${errorMessage}`,
                    success: false,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    }

    // For regular route creation (non-test), validate all required fields
    if (!name || !url || !expectedStatusCode || !monitoringInterval) {
        return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Create the route in the database
    try {
        const inserted = await db.insert(routes).values({
            id: crypto.randomUUID(),
            method,
            url,
            name,
            description,
            requestHeaders: requestHeaders
                ? JSON.stringify(requestHeaders)
                : JSON.stringify({}),
            requestBody: requestBody ? JSON.stringify(requestBody) : null,
            expectedStatusCode,
            responseTimeThreshold,
            monitoringInterval: parseInt(monitoringInterval),
            retries: retries ? parseInt(retries) : 0,
            alertEmail,
            isActive: true,
            userId: user.id,
        }).returning();
        const route = inserted[0];

        return new Response(JSON.stringify(route), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";

        return new Response(
            JSON.stringify({
                error: `Failed to create route: ${errorMessage}`,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
};
