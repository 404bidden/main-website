"use client";

import { authClient } from "@/lib/auth-client";
import { useParams, useRouter } from "next/navigation";

import { useEffect } from "react";

export default function RouteDetailsPage() {
    const { routeId } = useParams();
    const router = useRouter()
    const { data: session, error, isPending } = authClient.useSession()

    useEffect(() => {
        if ((error && !isPending) || !session && !isPending) {
            router.push("/auth/signin")
        }
    }, [
        session,
        error,
        isPending,
    ])

    return <div>Route Details for {routeId}</div>;
}