"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
    const { error, data, isPending } = authClient.useSession();
    const router = useRouter();
    useEffect(() => {
        if (error && !isPending && !data) {
            router.push("/auth/login"); // Redirect to login if not authenticated
        }
    }, [error, isPending, data, router]);
}