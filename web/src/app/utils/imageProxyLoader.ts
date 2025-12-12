

/**
 * Custom loader that proxies external images through our API endpoint.
 * Usage: <Image loader={imageProxyLoader} src="https://example.com/img.jpg" ... />
 */
export const imageProxyLoader = ({ src }: { src: string }) => {
    // We ignore width/quality for now – the proxy returns the original image.
    // Encode the original URL to safely pass it as a query parameter.
    const encoded = encodeURIComponent(src);
    return `/api/images?url=${encoded}`;
};
