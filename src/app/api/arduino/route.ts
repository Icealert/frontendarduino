import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    console.log('Checking credentials...');
    console.log('Client ID:', clientId?.substring(0, 5) + '...');
    console.log('Client Secret:', clientSecret?.substring(0, 5) + '...');

    if (!clientId || !clientSecret) {
      console.error('Missing Arduino IoT Cloud credentials');
      return NextResponse.json({ 
        error: 'Missing Arduino IoT Cloud credentials',
        details: {
          clientIdPresent: !!clientId,
          clientSecretPresent: !!clientSecret
        }
      }, { status: 400 });
    }

    console.log('Initializing Arduino IoT Cloud client...');
    try {
      const client = await createArduinoApiClient(clientId, clientSecret);
      console.log('Client initialized successfully');
      
      console.log('Fetching devices...');
      const devices = await client.getDevices();
      console.log(`Found ${devices.length} devices:`, devices);

      return NextResponse.json({ 
        success: true,
        devices,
        meta: {
          timestamp: new Date().toISOString(),
          count: devices.length
        }
      });
    } catch (clientError: any) {
      console.error('Error creating Arduino client:', {
        message: clientError.message,
        stack: clientError.stack,
        cause: clientError.cause
      });
      return NextResponse.json({ 
        error: 'Failed to initialize Arduino client',
        details: {
          message: clientError.message,
          cause: clientError.cause
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in Arduino API route:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({
      error: 'Failed to connect to Arduino IoT Cloud',
      details: {
        message: error.message,
        cause: error.cause
      }
    }, { status: 500 });
  }
} 