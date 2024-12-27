import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';
const TOKEN_ENDPOINT = 'https://api2.arduino.cc/iot/v1/clients/token';

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

async function getAccessToken(): Promise<string> {
  const clientId = process.env.client_id;
  const clientSecret = process.env.client_secret;

  if (!clientId || !clientSecret) {
    throw new Error('Missing credentials: client_id and client_secret are required in environment variables.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    audience: 'https://api2.arduino.cc/iot'
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
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

    // Get access token
    const accessToken = await getAccessToken();

    // Determine API version based on endpoint
    const version = 'v2';
    const url = `${ARDUINO_API_BASE}/${version}/${endpoint}`;

    // Get the request body if it exists
    let body: string | undefined;
    let requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    if (request.method !== 'GET') {
      requestHeaders['Content-Type'] = 'application/json';
      body = await request.text();
    }

    // Forward the request to Arduino API
    const response = await fetch(url, {
      method: request.method,
      headers: requestHeaders,
      body
    });

    // Get response as text first
    const responseText = await response.text();

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