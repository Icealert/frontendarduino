import { ArduinoDevice, ArduinoProperty, DeviceSettings } from '../types/arduino';

export interface ArduinoApiClient {
  getDevices: () => Promise<ArduinoDevice[]>;
  getDeviceProperties: (deviceId: string) => Promise<ArduinoProperty[]>;
  updateProperty: (deviceId: string, propertyId: string, value: any) => Promise<void>;
  getDeviceSettings: (deviceId: string) => Promise<DeviceSettings>;
  updateDeviceSettings: (deviceId: string, settings: Partial<DeviceSettings>) => Promise<void>;
}

export async function createArduinoApiClient(clientId: string, clientSecret: string) {
  const makeRequest = async (path: string, options: RequestInit = {}) => {
    try {
      console.log('Requesting access token...');
      // Get access token
      const tokenResponse = await fetch('https://api2.arduino.cc/iot/v1/clients/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          audience: 'https://api2.arduino.cc/iot',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Token response error:', errorData);
        throw new Error(`Failed to obtain access token: ${errorData.error || tokenResponse.statusText}`);
      }

      const { access_token } = await tokenResponse.json();
      console.log('Access token obtained successfully');

      // Make the actual API request
      console.log(`Making API request to ${path}...`);
      const response = await fetch(`https://api2.arduino.cc/iot/v2/${path}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API response error:', error);
        throw new Error(error.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API request to ${path} successful`);
      return data;
    } catch (error: any) {
      console.error('Request error:', error);
      throw error;
    }
  };

  return {
    async getDevices() {
      return makeRequest('things');
    },

    async getDeviceProperties(deviceId: string) {
      return makeRequest(`things/${deviceId}/properties`);
    },

    async getDeviceSettings(deviceId: string) {
      return makeRequest(`things/${deviceId}/settings`);
    },

    async updateDeviceSettings(deviceId: string, settings: any) {
      return makeRequest(`things/${deviceId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      return makeRequest(`things/${deviceId}/properties/${propertyId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
    },
  };
} 