import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function GET() {
  try {
    const clientId = process.env.client_id;
    const clientSecret = process.env.client_secret;

    if (!clientId || !clientSecret) {
      console.error('Missing Arduino credentials');
      return NextResponse.json(
        { error: 'Missing Arduino IoT Cloud credentials' },
        { status: 401 }
      );
    }

    console.log('Attempting to create Arduino client...');
    const client = await createArduinoApiClient();
    
    console.log('Fetching devices...');
    const devices = await client.getDevices();
    
    console.log(`Successfully fetched ${devices.length} devices`);
    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error('Arduino API error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('Failed to obtain access token')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please check your credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 