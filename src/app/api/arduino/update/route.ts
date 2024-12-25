import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';

export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Arduino IoT Cloud credentials');
      return NextResponse.json({ error: 'Missing Arduino IoT Cloud credentials' }, { status: 400 });
    }

    const { deviceId, propertyId, value } = await request.json();

    if (!deviceId || !propertyId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Updating property ${propertyId} for device ${deviceId} with value:`, value);
    
    const client = await createArduinoApiClient(clientId, clientSecret);
    await client.updateProperty(deviceId, propertyId, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Arduino update API route:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
} 