import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import "@/styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: {
        default: "Red SubContinent",
        template: "%s | Red SubContinent",
    },
    description:
        "A data-rich, interactive historical visualization of South Asian conflicts, invasions, famines, and major violent events from 1000 CE to the present.",
    keywords: [
        "South Asia",
        "history",
        "conflicts",
        "wars",
        "data visualization",
        "India",
        "Pakistan",
        "Bangladesh",
        "Afghanistan",
    ],
    authors: [{ name: "Red SubContinent Project" }],
    openGraph: {
        title: "Red SubContinent",
        description:
            "Interactive historical visualization of South Asian conflicts from 1000 CE to present.",
        type: "website",
        locale: "en_US",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans`}>
                <Providers>
                    <div className="min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-1">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
