import type { Metadata } from "next";
import { StoryContainer } from "@/components/story/StoryContainer";

export const metadata: Metadata = {
    title: "Story Mode",
    description:
        "Scroll through a cinematic narrative of South Asian history from 1000 CE to today.",
    alternates: {
        canonical: "/story",
    },
};

export default function StoryPage() {
    return <StoryContainer />;
}
