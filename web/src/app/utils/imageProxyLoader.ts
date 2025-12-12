/**
 * Custom loader that proxies external images through our API endpoint.
 * Usage: <Image loader={imageProxyLoader} src="https://example.com/img.jpg" ... />
 */
export const imageProxyLoader = ({
    src,
    width,
    quality,
}: {
    src: string;
    width?: number;
    quality?: number;
}) => {
    // Include width/quality so the proxy can optionally optimize later.
    const encoded = encodeURIComponent(src);
    const params = [`url=${encoded}`];
    if (width) params.push(`w=${width}`);
    if (quality) params.push(`q=${quality}`);
    return `/api/images?${params.join("&")}`;
};
