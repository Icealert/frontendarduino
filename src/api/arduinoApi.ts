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

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`https://api2.arduino.cc/iot/v2/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Check if there's a response body
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      return response.json();
    }
  };

  const client: ArduinoApiClient = {
    async getDevices() {
      const devices = await makeRequest('devices') as Promise<Omit<ArduinoDevice, 'status'>[]>;
      const devicesArray = await devices;
      
      // Map devices and explicitly type the status
      return devicesArray.map(device => ({
        ...device,
        status: device.events?.some(e => e.type === 'DEVICE_ONLINE') ? 'ONLINE' as const : 'OFFLINE' as const
      }));
    },

    async getDeviceProperties(deviceId: string) {
      return makeRequest(`devices/${deviceId}/properties`) as Promise<ArduinoProperty[]>;
    },

    async getDeviceSettings(deviceId: string) {
      const properties = await this.getDeviceProperties(deviceId);
      const settings: Partial<DeviceSettings> = {};

      // Map each property to its corresponding setting
      properties.forEach(prop => {
        const key = prop.name as keyof DeviceSettings;
        settings[key] = prop.value;
      });

      // Ensure all required properties are present with default values
      return {
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
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      await makeRequest(`devices/${deviceId}/properties/${propertyId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value })
      });
    }
  };

  return client;
} 