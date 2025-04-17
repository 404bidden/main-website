import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { filterSensitiveHeaders, validateUrlSecurity } from "@/lib/security";
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
        // Add User-Agent header to prevent some sites from blocking requests
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    };

    // Parse headers from the route configuration
    if (route.requestHeaders) {
        try {
            const parsedHeaders = JSON.parse(route.requestHeaders as string);
            // Use our helper function to filter sensitive headers
            Object.assign(
                requestHeaders,
                filterSensitiveHeaders(parsedHeaders),
            );
        } catch (error) {
            console.error("Error parsing request headers:", error);
        }
    }

    // Safety check for the URL using our helper function
    const securityCheck = validateUrlSecurity(route.url);
    if (!securityCheck.isValid) {
        return new Response(
            securityCheck.error || "Access denied for security reasons",
            {
                status: 403,
            },
        );
    }

    const targetUrl = new URL(route.url);

    // Add body validation before sending
    if (route.requestBody) {
        const bodySize = JSON.stringify(route.requestBody).length;
        if (bodySize > 1024 * 1024) {
            // 1MB limit example
            return new Response("Request body too large", { status: 400 });
        }
    }
    const startTime = performance.now();

    // Use fetch with redirects follow
    const response = await fetch(targetUrl, {
        method: route.method,
        headers: requestHeaders,
        body: route.requestBody ? JSON.stringify(route.requestBody) : undefined,
        redirect: "follow", // Follow redirects automatically
    });

    // Enhanced success determination logic with fair treatment for all domains
    const expectedStatus = route.expectedStatusCode || 200;

    // Determine success with consistent criteria for all domains
    let isSuccess = false;

    // Check if response matches expected status exactly
    if (response.status === expectedStatus) {
        isSuccess = true;
    }
    // Standard success codes (2xx range)
    else if (response.status >= 200 && response.status < 300) {
        isSuccess = true;
    }
    // Redirects are usually fine (3xx range)
    else if (response.status >= 300 && response.status < 400) {
        isSuccess = true;
    }
    // Authentication endpoints often return 401/403 by design
    else if (
        route.url.includes("/auth/") &&
        (response.status === 401 || response.status === 403)
    ) {
        isSuccess = true;
    }

    const requestLog = {
        routeId: route.id,
        statusCode: response.status,
        responseTime: performance.now() - startTime, // Store in milliseconds (not seconds)
        isSuccess: isSuccess,
        id: crypto.randomUUID(),
        createdAt: new Date(),
    };

    await prisma.requestLog.create({
        data: requestLog,
    });

    return new Response(
        JSON.stringify({
            ...route,
            lastResponse: {
                status: response.status,
                success: isSuccess,
                responseTime: requestLog.responseTime,
            },
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
};
