"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient
            .signOut()
            .then(() => {
                router.push("/auth/login"); // Redirect to login page after logout
                router.refresh(); // Refresh to update UI with unauthenticated state
            })
            .catch((error) => {
                console.error("Logout error:", error);
                setIsLoading(false); // Reset loading state on error
            });
        setIsLoading(false); // Reset loading state after logout
    };

    return (
        <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="outline"
            className={className}
        >
            {isLoading ? "Logging out..." : "Logout"}
        </Button>
    );
}
