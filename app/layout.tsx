import "@/styles/globals.css";
import clsx from "clsx";
import { Metadata, Viewport } from "next";

import { fontSans } from "@/config/fonts";
import { siteConfig } from "@/config/site";

import { Providers } from "./providers";

export const metadata: Metadata = {
    description: siteConfig.description,
    icons: {
        icon: "/favicon.ico",
    },
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { color: "white", media: "(prefers-color-scheme: light)" },
        { color: "black", media: "(prefers-color-scheme: dark)" },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="en">
            <head />
            <body
                className={clsx(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable,
                )}
            >
                <Providers
                    themeProps={{ attribute: "class", defaultTheme: "dark" }}
                >
                    <div className="flex flex-col">
                        <main className="grow">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
