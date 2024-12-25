import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://api2.arduino.cc/iot/v2';
const AUTH_URL = 'https://api2.arduino.cc/iot/v1/clients/token';

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Arduino credentials');
  }

  try {
    // Create form data for authentication
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('audience', 'https://api2.arduino.cc/iot');

    const response = await axios.post(AUTH_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.data.access_token) {
      throw new Error('No access token received');
    }

    return response.data.access_token;
  } catch (error: any) {
    console.error('Authentication error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Arduino IoT Cloud');
  }
}

async function fetchDevices(accessToken: string) {
  try {
    // First get all things (devices)
    const thingsResponse = await axios.get(`${API_BASE_URL}/things`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // For each thing, get its properties
    const devices = await Promise.all(
      thingsResponse.data.map(async (thing: any) => {
        try {
          const propertiesResponse = await axios.get(
            `${API_BASE_URL}/things/${thing.id}/properties`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          return {
            id: thing.id,
            name: thing.name,
            status: thing.connection_status || 'OFFLINE',
            properties: propertiesResponse.data.map((prop: any) => ({
              id: prop.id,
              name: prop.name,
              value: prop.last_value,
              type: prop.type,
              timestamp: prop.value_updated_at
            }))
          };
        } catch (error) {
          console.error(`Error fetching properties for thing ${thing.id}:`, error);
          return {
            id: thing.id,
            name: thing.name,
            status: thing.connection_status || 'OFFLINE',
            properties: []
          };
        }
      })
    );

    return devices;
  } catch (error: any) {
    console.error('Error fetching devices:', error.response?.data || error.message);
    throw new Error('Failed to fetch devices from Arduino IoT Cloud');
  }
}

export async function GET() {
  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Fetch devices with their properties
    const devices = await fetchDevices(accessToken);

    return NextResponse.json({
      devices,
      meta: {
        timestamp: new Date().toISOString(),
        count: devices.length
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 