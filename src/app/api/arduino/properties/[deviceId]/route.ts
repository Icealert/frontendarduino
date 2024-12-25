import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Arduino credentials');
      return NextResponse.json(
        { error: 'Missing Arduino IoT Cloud credentials' },
        { status: 401 }
      );
    }

    console.log('Attempting to create Arduino client...');
    const client = await createArduinoApiClient(clientId, clientSecret);
    
    console.log(`Fetching properties for device ${params.deviceId}...`);
    const properties = await client.getDeviceProperties(params.deviceId);
    
    console.log(`Successfully fetched ${properties.length} properties`);
    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('Arduino API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch device properties' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 