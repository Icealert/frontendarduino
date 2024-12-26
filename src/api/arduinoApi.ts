import { ArduinoDevice, ArduinoProperty, DeviceSettings, validateValue, DefaultValues } from '@/types/arduino';

export interface ArduinoApiClient {
  getDevices(): Promise<ArduinoDevice[]>;
  getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]>;
  updateProperty(deviceId: string, propertyId: string, value: any): Promise<void>;
  getDeviceSettings(deviceId: string): Promise<DeviceSettings>;
  updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>): Promise<void>;
}

export async function createArduinoApiClient(): Promise<ArduinoApiClient> {
  const client: ArduinoApiClient = {
    async getDevices() {
      const response = await fetch('/api/arduino');
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data.devices || [];
    },

    async getDeviceProperties(deviceId: string) {
      const response = await fetch(`/api/arduino?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch properties for device ${deviceId}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data.devices?.[0]?.properties || [];
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      const response = await fetch('/api/arduino/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          propertyId,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update property: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    },

    async getDeviceSettings(deviceId: string) {
      const response = await fetch(`/api/arduino/settings?deviceId=${deviceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings for device ${deviceId}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data.settings || {};
    },

    async updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>) {
      const response = await fetch(`/api/arduino/settings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId, settings }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    },
  };

  return client;
}
