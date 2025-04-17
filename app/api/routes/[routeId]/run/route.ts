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
    };

    // Parse headers from the route configuration
    if (route.requestHeaders) {
        try {
            const parsedHeaders = JSON.parse(route.requestHeaders as string);
            // Use our helper function to filter sensitive headers
            Object.assign(requestHeaders, filterSensitiveHeaders(parsedHeaders));
        } catch (error) {
            console.error("Error parsing request headers:", error);
        }
    }

    // Safety check for the URL using our helper function
    const securityCheck = validateUrlSecurity(route.url);
    if (!securityCheck.isValid) {
        return new Response(securityCheck.error || "Access denied for security reasons", {
            status: 403,
        });
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

    const response = await fetch(targetUrl, {
        method: route.method,
        headers: requestHeaders,
        body: route.requestBody ? JSON.stringify(route.requestBody) : undefined,
    });

    const requestLog = {
        routeId: route.id,
        statusCode: response.status,
        responseTime: (performance.now() - startTime) / 1000, // Store as number in seconds
        isSuccess: response.ok,
        id: crypto.randomUUID(),
        createdAt: new Date(),
    }

    await prisma.requestLog.create({
        data: requestLog,
    });

    return new Response(JSON.stringify(route), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
