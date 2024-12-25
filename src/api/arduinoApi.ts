'use client';

import { ArduinoDevice, ArduinoProperty, DeviceSettings } from '../types/arduino';

const API_BASE_URL = 'https://api2.arduino.cc/iot/v2';
const AUTH_URL = 'https://api2.arduino.cc/iot/v1/clients/token';

export interface ArduinoApiClient {
  getDevices: () => Promise<ArduinoDevice[]>;
  getDeviceProperties: (deviceId: string) => Promise<ArduinoProperty[]>;
  updateProperty: (deviceId: string, propertyId: string, value: any) => Promise<void>;
  getDeviceSettings: (deviceId: string) => Promise<DeviceSettings>;
  updateDeviceSettings: (deviceId: string, settings: Partial<DeviceSettings>) => Promise<void>;
}

export async function createArduinoApiClient(clientId: string, clientSecret: string) {
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
    throw new Error('Failed to obtain access token');
  }

  const { access_token } = await tokenResponse.json();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  };

  return {
    async getDevices() {
      return makeRequest('https://api2.arduino.cc/iot/v2/things');
    },

    async getDeviceProperties(deviceId: string) {
      return makeRequest(`https://api2.arduino.cc/iot/v2/things/${deviceId}/properties`);
    },

    async getDeviceSettings(deviceId: string) {
      return makeRequest(`https://api2.arduino.cc/iot/v2/things/${deviceId}/settings`);
    },

    async updateDeviceSettings(deviceId: string, settings: any) {
      return makeRequest(`https://api2.arduino.cc/iot/v2/things/${deviceId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      return makeRequest(`https://api2.arduino.cc/iot/v2/things/${deviceId}/properties/${propertyId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
    },
  };
} 