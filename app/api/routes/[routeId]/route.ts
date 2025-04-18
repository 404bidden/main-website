import { requestLog, routes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, type InferModel } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// Define type for logs
type LogModel = InferModel<typeof requestLog>;

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

    // Delete route ensuring user ownership
    const [deleted] = await db.delete(routes)
        .where(eq(routes.id, routeId), eq(routes.userId, session.user.id))
        .returning();

    return new Response(JSON.stringify(deleted), {
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

    // Fetch route ensuring user ownership
    const [result] = await db.select().from(routes)
        .where(eq(routes.id, routeId), eq(routes.userId, session.user.id));
    if (!result) {
        return new Response("Route not found", { status: 404 });
    }
    // Tag on responseTime to the response from the logs
    const requestLogs: LogModel[] = await db.select().from(requestLog)
        .where(eq(requestLog.routeId, routeId));

    const responseTime: number = requestLogs.reduce((acc: number, log: LogModel) => {
        // Convert from seconds to milliseconds if the value is small (older records)
        const logResponseTime = log.responseTime || 0;
        return (
            acc +
            (logResponseTime < 10 ? logResponseTime * 1000 : logResponseTime)
        );
    }, 0);
    const averageResponseTime =
        requestLogs.length > 0 ? responseTime / requestLogs.length : 0;

    return new Response(
        JSON.stringify({
            ...result,
            responseTime: averageResponseTime,
            logs: requestLogs,
        }),
        {
            status: 200,
        },
    );
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

    const body = await req.json();
    // Update route ensuring user ownership
    const [result] = await db.update(routes)
        .set(body)
        .where(eq(routes.id, routeId), eq(routes.userId, session.user.id))
        .returning();

    return new Response(JSON.stringify(result), {
        status: 200,
    });
};
