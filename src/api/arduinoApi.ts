import { ArduinoDevice, ArduinoProperty } from '@/types/arduino';

export interface ArduinoApiClient {
  getDevices(): Promise<ArduinoDevice[]>;
  getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]>;
  updateProperty(deviceId: string, propertyId: string, value: any): Promise<void>;
}

export async function createArduinoApiClient(clientId: string, clientSecret: string): Promise<ArduinoApiClient> {
  const tokenResponse = await fetch('https://api2.arduino.cc/iot/v1/clients/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: 'https://api2.arduino.cc/iot'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const { access_token } = await tokenResponse.json();

  return {
    async getDevices(): Promise<ArduinoDevice[]> {
      const response = await fetch('https://api2.arduino.cc/iot/v2/devices', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get devices: ${response.statusText}`);
      }

      return response.json();
    },

    async getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]> {
      const response = await fetch(`https://api2.arduino.cc/iot/v2/devices/${deviceId}/properties`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get device properties: ${response.statusText}`);
      }

      return response.json();
    },

    async updateProperty(deviceId: string, propertyId: string, value: any): Promise<void> {
      const response = await fetch(`https://api2.arduino.cc/iot/v2/devices/${deviceId}/properties/${propertyId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update property: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Check if there's a response body
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        await response.json(); // Consume the response body if it exists
      }
    }
  };
} 