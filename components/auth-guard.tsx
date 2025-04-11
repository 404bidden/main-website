"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const router = useRouter();
    const { error, isPending } = authClient.useSession()

    // Show loading state while checking authentication
    if (error || isPending) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (error) {
        if (!fallback) {
            router.push("/auth/login"); // Redirect to login page if not authenticated
        }
        return fallback || null;
    }
    return <>{children}</>;
}