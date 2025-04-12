import { auth } from "@/lib/auth";

import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

export const GET = async (req: NextRequest) => { // Route responsible for getting all the users routes
    const session = await auth.api.getSession({
        headers: req.headers,
    })

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;
    const routes = await prisma.route.findMany({
        where: {
            userId: user.id,
        }
    })

    return new Response(JSON.stringify(routes), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export const POST = async (req: NextRequest) => { // Route responsible for creating a new route
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }
    const { user } = session;
    const body = await req.json();
    const {
        name, // Name of the route.
        description, // Description of the route.
        method, // HTTP method (GET, POST, etc.).
        url,  // URL of the route to be monitored.
        headers: requestHeaders, // Headers to be sent with the request.
        body: requestBody, // Body of the request (for POST, PUT, etc.).
        expectedStatusCode,       // The expected HTTP status code from the route.
        responseTimeThreshold,    // Maximum acceptable response time (ms).
        monitoringInterval,       // Interval for checking the route (seconds).
        retries,                  // Number of retry attempts on failure.
        alertEmail                // Email for sending alerts if the check fails.
    } = body;

    // Validate required fields
    if (!name || !url || !expectedStatusCode || !monitoringInterval) {
        return new Response("Missing required fields", { status: 400 });
    }
    // Create the route in the database
    const route = await prisma.route.create({
        data: {
            id: crypto.randomUUID(), // Generate a unique ID for the route.
            method, // HTTP method (GET, POST, etc.).
            url,
            name, // Name of the route.
            description, // Description of the route.
            requestHeaders: requestHeaders ? JSON.stringify(requestHeaders) : JSON.stringify({}), // Headers to be sent with the request.
            requestBody: requestBody ? JSON.stringify(requestBody) : null, // Body of the request (for POST, PUT, etc.).
            expectedStatusCode, // The expected HTTP status code from the route.
            responseTimeThreshold, // Maximum acceptable response time (ms).
            monitoringInterval: parseInt(monitoringInterval), // Interval for checking the route  (seconds).
            retries: retries ? parseInt(retries) : 0, // Number of retry attempts on failure.
            alertEmail, // Email for sending alerts if the check fails.
            isActive: true, // Set the route as active by default.
            userId: user.id, // Associate the route with the authenticated user.
        },
    })

    return new Response(JSON.stringify(route), {
        status: 201,
        headers: {
            "Content-Type": "application/json",
        },
    })
}
