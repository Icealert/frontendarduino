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

    // Determine if this is a token request
    const isTokenRequest = endpoint.includes('clients/token');
    const apiVersion = isTokenRequest ? 'v1' : 'v2';
    const url = `${ARDUINO_API_BASE}/${apiVersion}/${endpoint}`;

    console.log('Proxying request to:', url);

    // Get the request body if it exists
    let body: string | undefined;
    let requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (request.method !== 'GET') {
      if (isTokenRequest) {
        // For token requests, handle exactly as per Arduino docs
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        const formData = new URLSearchParams(await request.text());
        body = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: formData.get('client_id') || '',
          client_secret: formData.get('client_secret') || '',
          audience: 'https://api2.arduino.cc/iot'
        }).toString();
      } else {
        // For other requests, use JSON and include authorization
        requestHeaders['Content-Type'] = 'application/json';
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
          requestHeaders['Authorization'] = authHeader;
        }
        body = await request.text();
      }
    }

    console.log('Request headers:', requestHeaders);
    if (isTokenRequest) {
      console.log('Token request body:', body);
    }

    // Forward the request to Arduino API
    const response = await fetch(url, {
      method: request.method,
      headers: requestHeaders,
      body
    });

    // For token requests, handle the response carefully
    if (isTokenRequest) {
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Token request failed:', responseData);
        return NextResponse.json(
          { error: responseData.error || 'Failed to obtain access token' },
          { status: response.status, headers: corsHeaders }
        );
      }

      if (!responseData.access_token) {
        console.error('Invalid token response:', responseData);
        return NextResponse.json(
          { error: 'Invalid token response from Arduino IoT Cloud' },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(responseData, { headers: corsHeaders });
    }

    // For non-token requests, handle response normally
    let responseData: any;
    try {
      if (response.headers.get('content-type')?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse response',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: typeof responseData === 'string' ? responseData : responseData.error || 'Request failed' },
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