import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    // Forward the request to Arduino API
    const response = await fetch(`https://api2.arduino.cc/iot/v2/${endpoint}`, {
      method: request.method,
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Arduino API request failed: ${error}` },
        { status: response.status }
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: `Proxy request failed: ${error.message}` },
      { status: 500 }
    );
  }
} 