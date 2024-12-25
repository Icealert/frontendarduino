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

    console.log(`Attempting to update property ${propertyName} for device ${deviceId} with value:`, value);
    
    const client = await createArduinoApiClient(clientId, clientSecret);
    
    try {
      // First get the device properties to find the property ID
      const properties = await client.getDeviceProperties(deviceId);
      const property = properties.find((p: ArduinoProperty) => p.name === propertyName);
      
      if (!property) {
        console.error(`Property ${propertyName} not found for device ${deviceId}`);
        return NextResponse.json({ error: `Property ${propertyName} not found` }, { status: 404 });
      }

      console.log(`Found property ${propertyName} with ID ${property.id}`);

      // Format the value based on the property type
      let formattedValue = value;
      switch (property.type) {
        case 'FLOAT':
        case 'NUMBER':
          formattedValue = parseFloat(value);
          if (isNaN(formattedValue)) {
            throw new Error(`Invalid number value for property ${propertyName}`);
          }
          break;
        case 'INTEGER':
          formattedValue = parseInt(value, 10);
          if (isNaN(formattedValue)) {
            throw new Error(`Invalid integer value for property ${propertyName}`);
          }
          break;
        case 'STRING':
          formattedValue = String(value);
          break;
        default:
          console.log(`Using default value format for type ${property.type}`);
      }

      // Use the propertiesV2Update endpoint to update the property
      await client.updateProperty(deviceId, property.id, formattedValue);
      console.log(`Successfully sent update for property ${propertyName}`);

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify the update by fetching the latest value
      const updatedProperties = await client.getDeviceProperties(deviceId);
      const updatedProperty = updatedProperties.find((p: ArduinoProperty) => p.id === property.id);

      if (!updatedProperty) {
        throw new Error(`Could not verify update for property ${propertyName}`);
      }

      console.log(`Verified update for property ${propertyName}:`, updatedProperty);

      return NextResponse.json({ 
        success: true,
        property: updatedProperty
      });
    } catch (updateError: any) {
      console.error('Error updating property:', updateError);
      return NextResponse.json({ 
        error: `Failed to update property: ${updateError.message}`,
        details: updateError.response?.data || updateError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in Arduino update API route:', error);
    return NextResponse.json({
      error: 'Failed to update property',
      details: error.message
    }, { status: 500 });
  }
} 