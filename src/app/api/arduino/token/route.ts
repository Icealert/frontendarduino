import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    // Get credentials from environment variables
    const clientId = process.env.client_id;
    const clientSecret = process.env.client_secret;

    // Log environment check (without exposing actual values)
    console.log('Environment variables check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length
    });

    // Validate required fields
    if (!clientId || !clientSecret) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Missing credentials: client_id and client_secret environment variables are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make request to Arduino IoT Cloud API
    const response = await fetch(`${ARDUINO_API_BASE}/v1/clients/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: 'https://api2.arduino.cc/iot'
      }).toString()
    });

    const responseText = await response.text();
    console.log('Arduino API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      hasResponse: !!responseText,
      responseLength: responseText.length
    });

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from Arduino IoT Cloud' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      console.error('Token request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error
      });
      return NextResponse.json(
        { error: responseData.error || 'Failed to obtain access token' },
        { status: response.status, headers: corsHeaders }
      );
    }

    if (!responseData?.access_token) {
      console.error('Invalid token response:', responseData);
      return NextResponse.json(
        { error: 'Invalid token response from Arduino IoT Cloud' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Successfully obtained token');

    // Return the token response with CORS headers
    return NextResponse.json(responseData, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    console.error('Token request error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
} 