import { ArduinoDevice, ArduinoProperty, DeviceSettings } from '@/types/arduino';

export interface ArduinoApiClient {
  getDevices(): Promise<ArduinoDevice[]>;
  getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]>;
  updateProperty(deviceId: string, propertyId: string, value: any): Promise<void>;
  getDeviceSettings(deviceId: string): Promise<DeviceSettings>;
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

    async getDeviceSettings(deviceId: string): Promise<DeviceSettings> {
      const properties = await this.getDeviceProperties(deviceId);
      const settings: Partial<DeviceSettings> = {};

      // Map each property to its corresponding setting
      properties.forEach(prop => {
        const key = prop.name as keyof DeviceSettings;
        if (key in settings) {
          settings[key] = prop.value;
        }
      });

      // Ensure all required properties are present with default values
      const defaultSettings: DeviceSettings = {
        alertEmail: settings.alertEmail || '',
        cloudflowrate: settings.cloudflowrate || 0,
        cloudhumidity: settings.cloudhumidity || 0,
        cloudtemp: settings.cloudtemp || 0,
        flowThresholdMin: settings.flowThresholdMin || 5,
        humidityThresholdMax: settings.humidityThresholdMax || 80,
        humidityThresholdMin: settings.humidityThresholdMin || 20,
        lastUpdateTime: settings.lastUpdateTime || new Date().toISOString(),
        noFlowCriticalTime: settings.noFlowCriticalTime || 5,
        noFlowWarningTime: settings.noFlowWarningTime || 3,
        tempThresholdMax: settings.tempThresholdMax || 30,
        tempThresholdMin: settings.tempThresholdMin || 10
      };

      return defaultSettings;
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