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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { error, data, isPending } = authClient.useSession();

    useEffect(() => {
        if (!error && !isPending && data) {
            router.push("/"); // Redirect to home if already authenticated
        }

        // Validate token exists
        if (!token) {
            addToast({
                title: "Invalid or missing reset token",
                description: "Please request a new password reset link",
                variant: "flat",
                color: "danger",
            });
        }
    }, [token, error, isPending, data, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password
        if (newPassword.length < 10) {
            addToast({
                title: "Password too short",
                description: "Password must be at least 10 characters long",
                variant: "flat",
                color: "danger",
            });
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            addToast({
                title: "Passwords do not match",
                description: "Please make sure both passwords match",
                variant: "flat",
                color: "danger",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await authClient.resetPassword({
                token,
                newPassword,
            });

            if (!response.error) {
                setIsSuccess(true);
                addToast({
                    title: "Password reset successful",
                    description: "Your password has been updated. You can now log in with your new password.",
                    variant: "flat",
                    color: "success",
                });
            } else {
                addToast({
                    title: "Failed to reset password",
                    description: response.error?.message || "There was an error resetting your password. Please try again or request a new reset link.",
                    variant: "flat",
                    color: "danger",
                });
            }
        } catch (err) {
            console.error("Password reset error:", err);
            addToast({
                title: "An unexpected error occurred",
                description: "There was a problem resetting your password. Please try again or request a new reset link.",
                variant: "flat",
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Reset Your Password
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? "Your password has been successfully reset"
                            : "Please enter your new password below"}
                    </CardDescription>
                </CardHeader>

                {isSuccess ? (
                    <div className="p-6 space-y-6">
                        <p className="text-center text-green-600">
                            Your password has been successfully reset!
                        </p>
                        <CardFooter className="flex justify-center pt-4">
                            <Button
                                className="w-full"
                                onClick={() => router.push("/auth/login")}
                            >
                                Go to Login
                            </Button>
                        </CardFooter>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit} className="w-full">
                        <CardContent className="space-y-4 w-full">
                            <div className="space-y-2">
                                <Input
                                    variant="bordered"
                                    label="New Password"
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onValueChange={setNewPassword}
                                    isRequired
                                    placeholder="••••••••••"
                                    description="Password must be at least 10 characters long"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    variant="bordered"
                                    label="Confirm New Password"
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onValueChange={setConfirmPassword}
                                    isRequired
                                    placeholder="••••••••••"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 w-full">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || !token}
                            >
                                {isSubmitting ? "Resetting..." : "Reset Password"}
                            </Button>
                            <div className="text-center text-sm">
                                Remember your password?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-blue-600 hover:underline"
                                >
                                    Back to Login
                                </Link>
                            </div>
                            <div className="text-center text-sm">
                                Link expired?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-blue-600 hover:underline"
                                >
                                    Request new reset link
                                </Link>
                            </div>
                        </CardFooter>
                    </Form>
                )}
            </Card>
        </div>
    );
}