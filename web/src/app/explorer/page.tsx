import type { Metadata } from "next";
import { ExplorerContainer } from "@/components/explorer/ExplorerContainer";

export const metadata: Metadata = {
    title: "Explorer",
    description:
        "Interactive map of South Asian conflicts from 1000 CE to present. Filter by era, event type, and region.",
};

export default function ExplorerPage() {
    return <ExplorerContainer />;
}
