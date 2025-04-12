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

    const { user } = session;

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

    const { user } = session;

    const prisma = new PrismaClient();
    const result = await prisma.route.findUnique({
        where: {
            id: routeId,
            userId: session.user.id,
        },
    });

    return new Response(JSON.stringify(result), {
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

    const { user } = session;

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
}