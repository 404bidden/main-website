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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const { error, data, isPending } = authClient.useSession();

    useEffect(() => {
        if (!error && !isPending && data) {
            router.push("/"); // Redirect to home if authenticated
        }
    }, [error, isPending, data, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await authClient.signIn.email({
                email,
                password,
            });

            if (response.data && !response.error) {
                router.push("/"); // Redirect to home after successful login
                router.refresh(); // Refresh to update UI with authenticated state
            } else {
                addToast({
                    title:
                        response.error.message ||
                        "Login failed. Please try again.",
                    variant: "flat",
                    color: "danger",
                });
            }
        } catch (err) {
            console.error("Login error:", err);
            addToast({
                title: "An unexpected error occurred. Please try again.",
                variant: "flat",
                color: "danger",
            });
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetEmail) {
            addToast({
                title: "Please enter your email address",
                variant: "flat",
                color: "danger",
            });
            return;
        }

        setIsResetting(true);
        try {
            const response = await authClient.forgetPassword({
                email: resetEmail,
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (!response.error) {
                addToast({
                    title: "Password reset email sent",
                    description: "Please check your email for instructions to reset your password",
                    variant: "flat",
                    color: "success",
                });
                setForgotPasswordOpen(false);
            } else {
                addToast({
                    title: response.error?.message || "Failed to send reset email",
                    variant: "flat",
                    color: "danger",
                });
            }
        } catch (err) {
            console.error("Password reset error:", err);
            addToast({
                title: "An unexpected error occurred. Please try again.",
                variant: "flat",
                color: "danger",
            });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Login to Your Account
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
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
                                placeholder="••••••••••"
                            />
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setForgotPasswordOpen(true)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 w-full">
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/auth/register"
                                className="text-blue-600 hover:underline"
                            >
                                Register
                            </Link>
                        </div>
                    </CardFooter>
                </Form>
            </Card>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset your password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <Input
                            variant="bordered"
                            label="Email Address"
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onValueChange={setResetEmail}
                            isRequired
                            placeholder="you@example.com"
                        />
                        <DialogFooter className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setForgotPasswordOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isResetting}
                            >
                                {isResetting ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
