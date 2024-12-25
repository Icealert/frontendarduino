import { NextResponse } from 'next/server';
import { createArduinoApiClient } from '@/api/arduinoApi';
import { ArduinoProperty } from '@/types/arduino';

export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Arduino IoT Cloud credentials');
      return NextResponse.json({ error: 'Missing Arduino IoT Cloud credentials' }, { status: 400 });
    }

    const { deviceId, propertyName, value } = await request.json();

    if (!deviceId || !propertyName || value === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Updating property ${propertyName} for device ${deviceId} with value:`, value);
    
    const client = await createArduinoApiClient(clientId, clientSecret);
    
    // Get the property ID first
    const properties = await client.getDeviceProperties(deviceId);
    const property = properties.find((p: ArduinoProperty) => p.name === propertyName);
    
    if (!property) {
      return NextResponse.json({ error: `Property ${propertyName} not found` }, { status: 404 });
    }

    // Update the property with the new value
    await client.updateProperty(deviceId, property.id, value);

    // Verify the update by fetching the latest value
    const updatedProperties = await client.getDeviceProperties(deviceId);
    const updatedProperty = updatedProperties.find((p: ArduinoProperty) => p.name === propertyName);

    if (!updatedProperty || updatedProperty.value !== value) {
      throw new Error('Property update verification failed');
    }

    return NextResponse.json({ 
      success: true,
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error in Arduino update API route:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
} 