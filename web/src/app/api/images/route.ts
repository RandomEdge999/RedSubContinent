// Image proxy endpoint for Next.js 13 app router
// URL: /api/images?url=<external_image_url>

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing "url" query parameter', { status: 400 });
    }

    try {
        // Fetch the external image
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: 502 });
        }
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = await response.arrayBuffer();

        // Return the image with proper headers and CORS support
        const headers = new Headers({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // cache for 1 day
            'Access-Control-Allow-Origin': '*',
        });
        return new NextResponse(buffer, { status: 200, headers });
    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Error fetching image', { status: 500 });
    }
}
