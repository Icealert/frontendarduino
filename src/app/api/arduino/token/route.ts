import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get('client_id');
    const clientSecret = formData.get('client_secret');

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make request to Arduino IoT Cloud API
    const response = await fetch(`${ARDUINO_API_BASE}/v1/clients/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId.toString(),
        client_secret: clientSecret.toString(),
        audience: 'https://api2.arduino.cc/iot'
      }).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Token request failed:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to obtain access token' },
        { status: response.status, headers: corsHeaders }
      );
    }

    if (!data.access_token) {
      console.error('Invalid token response:', data);
      return NextResponse.json(
        { error: 'Invalid token response from Arduino IoT Cloud' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, { headers: corsHeaders });
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