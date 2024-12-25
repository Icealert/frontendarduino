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
    
    try {
      // Get the property ID first
      const properties = await client.getDeviceProperties(deviceId);
      const property = properties.find((p: ArduinoProperty) => p.name === propertyName);
      
      if (!property) {
        console.error(`Property ${propertyName} not found`);
        return NextResponse.json({ error: `Property ${propertyName} not found` }, { status: 404 });
      }

      console.log(`Found property ${propertyName} with ID ${property.id}`);

      // Convert value to the correct type based on the property type
      let typedValue = value;
      if (property.type === 'FLOAT' || property.type === 'NUMBER') {
        typedValue = parseFloat(value);
      } else if (property.type === 'INTEGER') {
        typedValue = parseInt(value, 10);
      }

      // Update the property with the new value
      await client.updateProperty(deviceId, property.id, typedValue);
      console.log(`Successfully updated property ${propertyName} to value:`, typedValue);

      // Verify the update by fetching the latest value
      const updatedProperties = await client.getDeviceProperties(deviceId);
      const updatedProperty = updatedProperties.find((p: ArduinoProperty) => p.name === propertyName);

      if (!updatedProperty) {
        throw new Error(`Could not verify update for property ${propertyName}`);
      }

      return NextResponse.json({ 
        success: true,
        property: updatedProperty
      });
    } catch (updateError) {
      console.error('Error updating property:', updateError);
      return NextResponse.json({ 
        error: `Failed to update property: ${updateError.message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Arduino update API route:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
} 