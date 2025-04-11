"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/signout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                router.push("/auth/login");
                router.refresh(); // Refresh to update UI with unauthenticated state
            } else {
                console.error("Failed to logout");
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoading(false);
        }
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