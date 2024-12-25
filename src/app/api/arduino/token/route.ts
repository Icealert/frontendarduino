export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    // Get request body as text
    const body = await request.text();
    console.log('Raw request body:', body);

    // Parse the form data
    const params = new URLSearchParams(body);
    
    // Get credentials from environment if not in request
    const clientId = params.get('client_id') || process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = params.get('client_secret') || process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    // Log request details for debugging (without exposing secrets)
    console.log('Token request parameters:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      envClientId: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID,
      envClientSecret: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length
    });

    // Validate required fields
    if (!clientId || !clientSecret) {
      console.error('Missing credentials:', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret,
        envClientId: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID,
        envClientSecret: !!process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET
      });
      return NextResponse.json(
        { error: 'Missing credentials: client_id and client_secret are required. Check environment variables.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make request to Arduino IoT Cloud API
    const response = await fetch(`${ARDUINO_API_BASE}/v1/clients/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&audience=https://api2.arduino.cc/iot`
    });

    const responseText = await response.text();
    console.log('Arduino API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length
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
        data: responseData
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