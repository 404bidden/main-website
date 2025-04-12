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
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;

    const { routeId } = await params;
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
