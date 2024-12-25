import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function handleRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine API version based on endpoint
    const version = endpoint.startsWith('clients/token') ? 'v1' : 'v2';
    const url = `${ARDUINO_API_BASE}/${version}/${endpoint}`;

    console.log('Proxying request:', {
      method: request.method,
      url,
      endpoint,
      version
    });

    // Get the request body if it exists
    let body: string | undefined;
    let requestHeaders: Record<string, string> = {
      'accept': 'application/json',
    };

    // Copy authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      requestHeaders['authorization'] = authHeader;
    }

    if (request.method !== 'GET') {
      // For token requests, handle form data
      if (endpoint === 'clients/token') {
        requestHeaders['content-type'] = 'application/x-www-form-urlencoded';
        const formData = await request.formData();
        body = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: formData.get('client_id') || '',
          client_secret: formData.get('client_secret') || '',
          audience: 'https://api2.arduino.cc/iot'
        }).toString();
      } else {
        // For other requests, use JSON
        requestHeaders['content-type'] = 'application/json';
        body = await request.text();
      }
    }

    console.log('Request headers:', requestHeaders);

    // Forward the request to Arduino API
    const response = await fetch(url, {
      method: request.method,
      headers: requestHeaders,
      body
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Arduino API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    });

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON response from Arduino IoT Cloud' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      console.error('Request failed:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      return NextResponse.json(
        { error: responseData.error || 'Request to Arduino IoT Cloud failed' },
        { status: response.status, headers: corsHeaders }
      );
    }

    return NextResponse.json(responseData, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 