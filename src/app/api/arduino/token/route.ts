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
    // Get request body as text and parse it
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');
    const grantType = params.get('grant_type');
    const audience = params.get('audience');

    // Log request details for debugging
    console.log('Token request received:', {
      clientId: clientId ? '[REDACTED]' : undefined,
      clientSecret: clientSecret ? '[REDACTED]' : undefined,
      grantType,
      audience
    });

    // Validate required fields
    if (!clientId || !clientSecret || !grantType || !audience) {
      console.error('Missing required fields:', { clientId: !!clientId, clientSecret: !!clientSecret, grantType, audience });
      return NextResponse.json(
        { error: 'Missing required fields: client_id, client_secret, grant_type, and audience are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make request to Arduino IoT Cloud API
    const response = await fetch(`${ARDUINO_API_BASE}/v1/clients/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: grantType,
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience
      }).toString()
    });

    let responseData;
    try {
      const responseText = await response.text();
      console.log('Arduino API raw response:', responseText);
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON response from Arduino IoT Cloud' },
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('Failed to read Arduino API response:', error);
      return NextResponse.json(
        { error: 'Failed to read response from Arduino IoT Cloud' },
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