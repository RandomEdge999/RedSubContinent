// src/app/utils/fetchExternalImage.ts
// Simple utility that attempts to retrieve a related image from Wikipedia based on a search term.
// It uses the MediaWiki API to get the original image URL of the first matching page.
// Returns the image URL string or null if none found.

export async function fetchExternalImage(searchTerm: string): Promise<string | null> {
    try {
        const endpoint = "https://en.wikipedia.org/w/api.php";
        const params = new URLSearchParams({
            action: "query",
            format: "json",
            prop: "pageimages",
            piprop: "original",
            redirects: "1",
            titles: searchTerm,
            origin: "*",
        });
        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (!response.ok) return null;
        const data = await response.json();
        const pages: any = data?.query?.pages;
        if (!pages) return null;
        const page: any = Object.values(pages)[0];
        return (page?.original?.source) ?? null;
    } catch (e) {
        console.error("fetchExternalImage error", e);
        return null;
    }
}
