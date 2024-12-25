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
    if (request.method !== 'GET') {
      body = await request.text();
      console.log('Request body:', body);
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // For token requests, use form-urlencoded content type
    if (isTokenRequest) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      headers['Content-Type'] = 'application/json';
      // Add Authorization header for non-token requests if present
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
    }

    console.log('Request headers:', headers);

    // Forward the request to Arduino API
    const response = await fetch(url, {
      method: request.method,
      headers,
      body
    });

    // Get response data
    let responseData: any;
    const contentType = response.headers.get('content-type');

    try {
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      console.log('Response data:', responseData);
    } catch (error) {
      console.error('Error parsing response:', error);
      responseData = { error: 'Failed to parse response' };
    }

    // Handle error responses
    if (!response.ok) {
      console.error('Arduino API error response:', responseData);
      return NextResponse.json(
        { 
          error: `Arduino API request failed: ${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}`,
          status: response.status,
          url: url
        },
        { 
          status: response.status,
          headers: corsHeaders
        }
      );
    }

    // Return successful response
    return NextResponse.json(responseData, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: `Proxy request failed: ${error.message}`,
        stack: error.stack
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 