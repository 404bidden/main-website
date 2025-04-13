import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const POST = async (
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            routeId: string;
        }>;
    },
) => {
    const { routeId } = await params;
    if (!routeId) {
        return new Response("Route ID is required", { status: 400 });
    }
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;

    const prisma = new PrismaClient();
    const route = await prisma.route.findUnique({
        where: {
            id: routeId,
            userId: session.user.id,
        },
    });

    if (!route) {
        return new Response("Route not found", { status: 404 });
    }

    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (route.requestHeaders) {
        const parsedHeaders = JSON.parse(route.requestHeaders as string);
        for (const key in parsedHeaders) {
            requestHeaders[key] = parsedHeaders[key];
        }
    }
    if (route.requestHeaders) {
        const parsedHeaders = JSON.parse(route.requestHeaders as string);
        const forbiddenHeaders = [
            // Authentication headers
            "authorization",
            "proxy-authorization",
            "cookie",
            "set-cookie",
            "x-csrf-token",

            // Browser-specific authentication
            "www-authenticate",
            "proxy-authenticate",

            // Tracking/identity headers
            "x-forwarded-for",
            "x-real-ip",
            "forwarded",
            "x-forwarded-host",
            "x-forwarded-proto",
            "x-forwarded-ssl",
            "x-correlation-id",
            "fastly-client-ip",
            "true-client-ip",

            // Security headers that should not be forwarded
            "sec-",
            "proxy-",
            "cf-",
            "x-csrf",
            "x-xsrf",
            "strict-transport-security",
            "content-security-policy",
            "x-content-security-policy",
            "x-webkit-csp",

            // Internal/sensitive headers
            "x-api-key",
            "x-internal",
            "x-secret",
            "x-amz-security-token",
            "api-key",
            "x-functions-key",
            "x-goog-authenticated-user-email",
            "x-aws-",
            "x-amz-",
            "x-azure-",
            "x-gcp-",
            "x-heroku-",
            "x-vercel-",

            // Debug and instrumentation headers
            "x-debug",
            "x-runtime",
            "x-request-id",
            "x-trace",
        ];

        for (const key in parsedHeaders) {
            if (forbiddenHeaders.includes(key.toLowerCase())) {
                continue; // Skip sensitive headers
            }
            requestHeaders[key] = parsedHeaders[key];
        }
    }

    const targetUrl = new URL(route.url);
    // Check for localhost/private IP addresses and other security risks
    if (
        // Block localhost and loopback addresses
        targetUrl.hostname === "localhost" ||
        targetUrl.hostname === "127.0.0.1" ||
        /^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
            targetUrl.hostname,
        ) ||
        targetUrl.hostname === "[::1]" ||
        // Block private IP ranges (IPv4)
        /^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
            targetUrl.hostname,
        ) ||
        /^172\.(1[6-9]|2[0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
            targetUrl.hostname,
        ) ||
        /^192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/.test(targetUrl.hostname) ||
        // Block link-local addresses
        /^169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/.test(targetUrl.hostname) ||
        // Block carrier-grade NAT addresses
        /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
            targetUrl.hostname,
        ) ||
        // Block private/local IPv6 addresses
        /^fc00:/.test(targetUrl.hostname) ||
        /^fd[0-9a-f]{2}:/.test(targetUrl.hostname) ||
        /^fe80:/.test(targetUrl.hostname) ||
        // Block internal DNS names
        /\.(local|internal|private|localhost|corp|home|lan)$/.test(
            targetUrl.hostname,
        ) ||
        // Block cloud metadata services
        /(^|\.)metadata\.(aws|google|azure|do)\./.test(targetUrl.hostname) ||
        targetUrl.hostname === "169.254.169.254" ||
        // Block sensitive ports
        [
            21, 22, 23, 25, 80, 111, 135, 137, 139, 389, 445, 1433, 1521, 3306,
            3389, 5432, 5900, 6379, 9200, 11211, 27017,
        ].includes(Number(targetUrl.port)) ||
        // Block requests to sensitive endpoints
        /\.well-known\/(webfinger|host-meta)/.test(targetUrl.pathname) ||
        targetUrl.pathname.includes("/.discovery")
    ) {
        return new Response("Access denied for security reasons", {
            status: 403,
        });
    }

    // Add body validation before sending
    if (route.requestBody) {
        const bodySize = JSON.stringify(route.requestBody).length;
        if (bodySize > 1024 * 1024) {
            // 1MB limit example
            return new Response("Request body too large", { status: 400 });
        }
    }
    const startTime = performance.now();

    const response = await fetch(targetUrl, {
        method: route.method,
        headers: requestHeaders,
        body: route.requestBody ? JSON.stringify(route.requestBody) : undefined,
    });

    await prisma.requestLog.create({
        data: {
            routeId: route.id,
            statusCode: response.status,
            responseTime: (performance.now() - startTime) / 1000, // Store as number in seconds
            isSuccess: response.ok,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        },
    });

    return new Response(JSON.stringify(route), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
