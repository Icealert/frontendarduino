import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Arduino IoT Cloud credentials' },
        { status: 401 }
      );
    }

    const client = await createArduinoApiClient(clientId, clientSecret);
    const devices = await client.getDevices();

    return new NextResponse(JSON.stringify(devices), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Arduino API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch devices' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 