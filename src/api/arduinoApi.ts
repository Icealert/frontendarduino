'use client';

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
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/proxy?path=${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
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
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      return makeRequest(`things/${deviceId}/properties/${propertyId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });
    },
  };
} 