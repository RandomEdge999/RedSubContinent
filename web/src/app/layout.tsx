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
    metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"),
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
        "Mughals",
        "British Raj",
        "Partition",
    ],
    authors: [{ name: "Red SubContinent Project" }],
    openGraph: {
        title: "Red SubContinent",
        description:
            "Interactive historical visualization of South Asian conflicts from 1000 CE to present.",
        url: "/",
        siteName: "Red SubContinent",
        images: [
            {
                url: "/og-image.jpg", // We'll need to ensure this exists or use a generic one
                width: 1200,
                height: 630,
                alt: "Red SubContinent - A Thouand Years of Conflict",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Red SubContinent",
        description: "A visual journey through 1000 years of South Asian history.",
        images: ["/og-image.jpg"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "/",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
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
