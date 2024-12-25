export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const ARDUINO_API_BASE = 'https://api2.arduino.cc/iot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
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

    // Get the device ID from query parameters if present
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    // If deviceId is provided, fetch properties for that device
    if (deviceId) {
      console.log('Fetching properties for device:', deviceId);
      const propertiesResponse = await fetch(`${ARDUINO_API_BASE}/v2/devices/${deviceId}/properties`, {
        headers: {
          'authorization': `Bearer ${tokenData.access_token}`,
          'content-type': 'application/json'
        }
      });

      const propertiesText = await propertiesResponse.text();
      console.log('Properties response:', {
        status: propertiesResponse.status,
        statusText: propertiesResponse.statusText,
        responseLength: propertiesText.length
      });

      let propertiesData;
      try {
        propertiesData = JSON.parse(propertiesText);
      } catch (error) {
        console.error('Failed to parse properties response:', error);
        return NextResponse.json(
          { error: 'Invalid response from Arduino IoT Cloud when fetching properties' },
          { status: 500, headers: corsHeaders }
        );
      }

      if (!propertiesResponse.ok) {
        console.error('Failed to fetch device properties:', {
          status: propertiesResponse.status,
          statusText: propertiesResponse.statusText,
          error: propertiesData.error
        });
        return NextResponse.json(
          { error: propertiesData.error || 'Failed to fetch device properties' },
          { status: propertiesResponse.status, headers: corsHeaders }
        );
      }

      return NextResponse.json({ properties: propertiesData }, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store'
        }
      });
    }

    // Otherwise, fetch all devices
    const devicesResponse = await fetch(`${ARDUINO_API_BASE}/v2/devices`, {
      headers: {
        'authorization': `Bearer ${tokenData.access_token}`,
        'content-type': 'application/json'
      }
    });

    const devicesText = await devicesResponse.text();
    console.log('Devices response:', {
      status: devicesResponse.status,
      statusText: devicesResponse.statusText,
      responseLength: devicesText.length
    });

    let devicesData;
    try {
      devicesData = JSON.parse(devicesText);
    } catch (error) {
      console.error('Failed to parse devices response:', error);
      return NextResponse.json(
        { error: 'Invalid response from Arduino IoT Cloud when fetching devices' },
        { status: 500, headers: corsHeaders }
      );
    }

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

    // For each device, fetch its properties
    const devicesWithProperties = await Promise.all(
      devicesData.map(async (device: any) => {
        try {
          const propertiesResponse = await fetch(`${ARDUINO_API_BASE}/v2/devices/${device.id}/properties`, {
            headers: {
              'authorization': `Bearer ${tokenData.access_token}`,
              'content-type': 'application/json'
            }
          });

          if (!propertiesResponse.ok) {
            console.warn(`Failed to fetch properties for device ${device.id}:`, {
              status: propertiesResponse.status,
              statusText: propertiesResponse.statusText
            });
            return device;
          }

          const properties = await propertiesResponse.json();
          return { ...device, properties };
        } catch (error) {
          console.warn(`Error fetching properties for device ${device.id}:`, error);
          return device;
        }
      })
    );

    console.log('Successfully fetched devices and properties:', {
      deviceCount: devicesWithProperties.length,
      status: devicesResponse.status
    });

    // Return the devices with their properties
    return NextResponse.json({ devices: devicesWithProperties }, {
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