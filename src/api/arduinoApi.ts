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
      const response = await fetch('/api/arduino/proxy?endpoint=devices');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data || [];
    },

    async getDeviceProperties(deviceId: string) {
      const response = await fetch(`/api/arduino/proxy?endpoint=devices/${deviceId}/properties`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data || [];
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      const response = await fetch(`/api/arduino/proxy?endpoint=devices/${deviceId}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
    },

    async getDeviceSettings(deviceId: string) {
      const properties = await this.getDeviceProperties(deviceId);
      const settings: Partial<DeviceSettings> = {};

      // First, set all properties to their default values
      (Object.keys(DefaultValues) as Array<keyof DeviceSettings>).forEach(key => {
        settings[key] = DefaultValues[key];
      });

      // Then override with actual values from the device
      properties.forEach((prop: ArduinoProperty) => {
        const name = prop.name as keyof DeviceSettings;
        if (name && name in DefaultValues) {
          settings[name] = prop.value;
        }
      });

      return settings as DeviceSettings;
    },

    async updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>) {
      const properties = await this.getDeviceProperties(deviceId);
      const updates: Promise<void>[] = [];

      Object.entries(settings).forEach(([name, value]) => {
        const property = properties.find((p: ArduinoProperty) => p.name === name);
        if (property && validateValue(name as any, value)) {
          updates.push(this.updateProperty(deviceId, property.id, value));
        }
      });

      await Promise.all(updates);
    }
  };

  return client;
} 