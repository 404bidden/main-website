import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { filterSensitiveHeaders, validateUrlSecurity } from "@/lib/security";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

export const GET = async (req: NextRequest) => {
    // Route responsible for getting all the users routes
    const session = await auth.api.getSession({
        headers: req.headers,
    });

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;
    const routes = await prisma.route.findMany({
        where: {
            userId: user.id,
        },
        include: {
            RequestLog: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 100, // Fetch the last 100 logs to calculate uptime
            },
        },
    });

    // Enhance the route data with metrics
    const routesWithMetrics = routes.map((route) => {
        const logs = route.RequestLog;
        const lastLog = logs.length > 0 ? logs[0] : null;

        // Calculate more detailed metrics
        const totalRequests = logs.length;
        const successfulRequests = logs.filter((log) => log.isSuccess).length;
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
                const recentLogs = logs.slice(0, 5);
                const recentFailures = recentLogs.filter(
                    (log) => !log.isSuccess,
                ).length;
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

        // Define type for the route with metrics

        // Calculate average response time
        const avgResponseTime =
            totalRequests > 0
                ? logs.reduce((sum, log) => {
                      // Convert from seconds to milliseconds if the value is small (older records)
                      const responseTime = log.responseTime || 0;
                      return (
                          sum +
                          (responseTime < 10
                              ? responseTime * 1000
                              : responseTime)
                      );
                  }, 0) / totalRequests
                : 0;

        // Calculate recent metrics (last 24h if available)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs = logs.filter(
            (log) =>
                log.createdAt && new Date(log.createdAt) >= twentyFourHoursAgo,
        );
        const recentUptime =
            recentLogs.length > 0
                ? (recentLogs.filter((log) => log.isSuccess).length /
                      recentLogs.length) *
                  100
                : uptimePercentage;

        return {
            id: route.id,
            name: route.name,
            url: route.url,
            method: route.method,
            status,
            statusCode: lastLog?.statusCode,
            // Use lastLog response time if available, otherwise use the calculated average
            // Always return a number (0 if no data) instead of undefined
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
        const route = await prisma.route.create({
            data: {
                id: crypto.randomUUID(), // Generate a unique ID for the route.
                method, // HTTP method (GET, POST, etc.).
                url,
                name, // Name of the route.
                description, // Description of the route.
                requestHeaders: requestHeaders
                    ? JSON.stringify(requestHeaders)
                    : JSON.stringify({}), // Headers to be sent with the request.
                requestBody: requestBody ? JSON.stringify(requestBody) : null, // Body of the request (for POST, PUT, etc.).
                expectedStatusCode, // The expected HTTP status code from the route.
                responseTimeThreshold, // Maximum acceptable response time (ms).
                monitoringInterval: parseInt(monitoringInterval), // Interval for checking the route (seconds).
                retries: retries ? parseInt(retries) : 0, // Number of retry attempts on failure.
                alertEmail, // Email for sending alerts if the check fails.
                isActive: true, // Set the route as active by default.
                userId: user.id, // Associate the route with the authenticated user.
            },
        });

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
