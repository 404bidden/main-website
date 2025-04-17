import { PrismaClient } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const DELETE = async (
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

    const prisma = new PrismaClient();
    const result = await prisma.route.delete({
        where: {
            id: routeId,
            userId: session.user.id,
        },
    });

    return new Response(JSON.stringify(result), {
        status: 200,
    });
};

export const GET = async (
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


    const prisma = new PrismaClient();
    const result = await prisma.route.findUnique({
        where: {
            id: routeId,
            userId: session.user.id,
        },
    });
    if (!result) {
        return new Response("Route not found", { status: 404 });
    }
    // Tag on responseTime to the response from the logs
    const requestLogs = await prisma.requestLog.findMany({
        where: {
            routeId: routeId,
        }
    })

    const responseTime = requestLogs.reduce((acc, log) => {
        // Convert from seconds to milliseconds if the value is small (older records)
        const logResponseTime = log.responseTime || 0;
        return acc + (logResponseTime < 10 ? logResponseTime * 1000 : logResponseTime);
    }, 0);
    const averageResponseTime = requestLogs.length > 0 ? responseTime / requestLogs.length : 0;

    return new Response(JSON.stringify({
        ...result,
        responseTime: averageResponseTime,
        logs: requestLogs,
    }), {
        status: 200,
    });
};

export const PUT = async (
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

    const prisma = new PrismaClient();
    const body = await req.json();

    const result = await prisma.route.update({
        where: {
            id: routeId,
            userId: session.user.id,
        },
        data: body,
    });

    return new Response(JSON.stringify(result), {
        status: 200,
    });
};
