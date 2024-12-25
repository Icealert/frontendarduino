import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function POST(request: Request) {
  try {
    const { deviceId, propertyName, value } = await request.json();

    if (!deviceId || !propertyName || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Arduino IoT Cloud credentials');
    }

    console.log('Updating property:', { deviceId, propertyName, value });

    // Create API client with credentials
    const api = createArduinoApiClient(clientId, clientSecret);

    // Update the property value
    await api.updateProperty(deviceId, propertyName, value);

    console.log('Property updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update property' },
      { status: 500 }
    );
  }
} 