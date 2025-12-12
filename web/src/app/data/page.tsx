import type { Metadata } from "next";
import { DataContainer } from "@/components/data/DataContainer";

export const metadata: Metadata = {
    title: "Data & Methodology",
    description:
        "Browse the raw data, understand our methodology, and download datasets.",
    alternates: {
        canonical: "/data",
    },
};

export default function DataPage() {
    return <DataContainer />;
}
