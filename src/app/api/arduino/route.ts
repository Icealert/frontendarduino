export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  try {
    // Get credentials from environment variables
    const clientId = process.env.client_id;
    const clientSecret = process.env.client_secret;

    if (!clientId || !clientSecret) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Missing credentials: client_id and client_secret environment variables are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // First, get an access token
    const tokenResponse = await fetch(`${ARDUINO_API_BASE}/v1/clients/token`, {
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

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to obtain access token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      });
      return NextResponse.json(
        { error: 'Failed to authenticate with Arduino IoT Cloud' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Now use the token to fetch devices
    const devicesResponse = await fetch(`${ARDUINO_API_BASE}/v2/devices`, {
      headers: {
        'authorization': `Bearer ${tokenData.access_token}`,
        'content-type': 'application/json'
      }
    });

    const devicesData = await devicesResponse.json();

    if (!devicesResponse.ok) {
      console.error('Failed to fetch devices:', {
        status: devicesResponse.status,
        statusText: devicesResponse.statusText,
        error: devicesData.error
      });
      return NextResponse.json(
        { error: devicesData.error || 'Failed to fetch devices' },
        { status: devicesResponse.status, headers: corsHeaders }
      );
    }

    console.log('Successfully fetched devices:', {
      count: Array.isArray(devicesData) ? devicesData.length : 'unknown',
      status: devicesResponse.status
    });

    // Return the devices with CORS headers
    return NextResponse.json({ devices: devicesData }, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    console.error('Arduino API error:', error);
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