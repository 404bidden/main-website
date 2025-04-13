"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export interface ProvidersProps {
    children: React.ReactNode;
    themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NonNullable<
            Parameters<ReturnType<typeof useRouter>["push"]>[1]
        >;
    }
}

export const Providers = ({ children, themeProps }: ProvidersProps) => {
    const router = useRouter();
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <HeroUIProvider navigate={router.push}>
                <ToastProvider />
                <NextThemesProvider {...themeProps}>
                    {children}
                </NextThemesProvider>
            </HeroUIProvider>
        </QueryClientProvider>
    );
};
