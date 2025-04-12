"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { error, data, isPending } = authClient.useSession();

    useEffect(() => {
        if (!error && !isPending && data) {
            router.push("/"); // Redirect to home if authenticated
        }
    }, [error, isPending, data, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast({
                title: "Passwords do not match",
                variant: "flat",
                color: "danger",
            });
            return;
        }

        if (password.length < 10) {
            addToast({
                title: "Password must be at least 10 characters long",
                variant: "flat",
                color: "danger",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await authClient.signUp.email({
                email,
                password,
                name: email.split("@")[0], // Use the part before "@" as the name
            });

            if (response.data && !response.error) {
                router.push("/"); // Redirect to home after successful registration
                router.refresh(); // Refresh to update UI with authenticated state
            } else {
                addToast({
                    title:
                        response.error.message ||
                        "Registration failed. Please try again.",
                    variant: "flat",
                    color: "danger",
                });
            }
        } catch (err) {
            console.error("Registration error:", err);
            addToast({
                title: "An unexpected error occurred. Please try again.",
                variant: "flat",
                color: "danger",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Create an Account
                    </CardTitle>
                    <CardDescription>
                        Sign up to get started with our platform
                    </CardDescription>
                </CardHeader>
                <Form onSubmit={handleSubmit} className="w-full">
                    <CardContent className="space-y-4 w-full">
                        <div className="space-y-2">
                            <Input
                                variant="bordered"
                                label="Email Address"
                                id="email"
                                type="email"
                                value={email}
                                onValueChange={setEmail}
                                isRequired
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                variant="bordered"
                                label="Password"
                                id="password"
                                type="password"
                                value={password}
                                onValueChange={setPassword}
                                isRequired
                                minLength={10}
                                placeholder="••••••••••"
                                description="Password must be at least 10 characters long"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                variant="bordered"
                                label="Confirm Password"
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onValueChange={setConfirmPassword}
                                isRequired
                                minLength={10}
                                placeholder="••••••••••"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 w-full">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </Button>
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link
                                href="/auth/login"
                                className="text-blue-600 hover:underline"
                            >
                                Log in
                            </Link>
                        </div>
                    </CardFooter>
                </Form>
            </Card>
        </div>
    );
}
