import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const clientId = formData.get('client_id');
    const clientSecret = formData.get('client_secret');
    const grantType = formData.get('grant_type');
    const audience = formData.get('audience');

    // Log request details for debugging
    console.log('Token request received:', {
      clientId: clientId ? '[REDACTED]' : undefined,
      clientSecret: clientSecret ? '[REDACTED]' : undefined,
      grantType,
      audience
    });

    // Validate required fields
    if (!clientId || !clientSecret || !grantType || !audience) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, client_secret, grant_type, and audience are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Construct the Arduino API URL
    const arduinoTokenUrl = new URL('/v1/clients/token', ARDUINO_API_BASE);

    // Make request to Arduino IoT Cloud API
    const response = await fetch(arduinoTokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: grantType.toString(),
        client_id: clientId.toString(),
        client_secret: clientSecret.toString(),
        audience: audience.toString()
      }).toString()
    });

    let responseData;
    try {
      responseData = await response.json();
      console.log('Arduino API response received:', {
        status: response.status,
        ok: response.ok,
        hasAccessToken: !!responseData?.access_token
      });
    } catch (error) {
      console.error('Failed to parse Arduino API response:', error);
      return NextResponse.json(
        { error: 'Invalid response from Arduino IoT Cloud' },
        { status: 500, headers: corsHeaders }
      );
    }

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