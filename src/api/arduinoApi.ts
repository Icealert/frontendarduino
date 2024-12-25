import { ArduinoDevice, ArduinoProperty, DeviceSettings, validateValue, getDefaultValue } from '@/types/arduino';

export interface ArduinoApiClient {
  getDevices(): Promise<ArduinoDevice[]>;
  getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]>;
  updateProperty(deviceId: string, propertyId: string, value: any): Promise<void>;
  getDeviceSettings(deviceId: string): Promise<DeviceSettings>;
  updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>): Promise<void>;
}

export async function createArduinoApiClient(clientId: string, clientSecret: string): Promise<ArduinoApiClient> {
  // Get access token through our proxy API
  const tokenResponse = await fetch('/api/arduino/proxy?endpoint=clients/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: 'https://api2.arduino.cc/iot'
    }).toString()
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    throw new Error(`Failed to get access token: ${error.error || error.message || tokenResponse.statusText}`);
  }

  const { access_token } = await tokenResponse.json();

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    // Use our serverless proxy for all Arduino API requests
    const response = await fetch(`/api/arduino/proxy?endpoint=${encodeURIComponent(endpoint)}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API request failed: ${error.error || response.statusText}`);
    }

    return response.json();
  };

  const client: ArduinoApiClient = {
    async getDevices() {
      const devices = await makeRequest('devices') as Promise<Omit<ArduinoDevice, 'status'>[]>;
      const devicesArray = await devices;
      
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

      properties.forEach(prop => {
        const key = prop.name as keyof DeviceSettings;
        settings[key] = prop.value;
      });

      // Return settings with proper type validation and defaults
      return {
        alertEmail: validateValue('alertEmail', settings.alertEmail) ? settings.alertEmail : getDefaultValue('alertEmail'),
        cloudflowrate: validateValue('cloudflowrate', settings.cloudflowrate) ? settings.cloudflowrate : getDefaultValue('cloudflowrate'),
        cloudhumidity: validateValue('cloudhumidity', settings.cloudhumidity) ? settings.cloudhumidity : getDefaultValue('cloudhumidity'),
        cloudtemp: validateValue('cloudtemp', settings.cloudtemp) ? settings.cloudtemp : getDefaultValue('cloudtemp'),
        flowThresholdMin: validateValue('flowThresholdMin', settings.flowThresholdMin) ? settings.flowThresholdMin : getDefaultValue('flowThresholdMin'),
        humidityThresholdMax: validateValue('humidityThresholdMax', settings.humidityThresholdMax) ? settings.humidityThresholdMax : getDefaultValue('humidityThresholdMax'),
        humidityThresholdMin: validateValue('humidityThresholdMin', settings.humidityThresholdMin) ? settings.humidityThresholdMin : getDefaultValue('humidityThresholdMin'),
        lastUpdateTime: validateValue('lastUpdateTime', settings.lastUpdateTime) ? settings.lastUpdateTime : getDefaultValue('lastUpdateTime'),
        noFlowCriticalTime: validateValue('noFlowCriticalTime', settings.noFlowCriticalTime) ? settings.noFlowCriticalTime : getDefaultValue('noFlowCriticalTime'),
        noFlowWarningTime: validateValue('noFlowWarningTime', settings.noFlowWarningTime) ? settings.noFlowWarningTime : getDefaultValue('noFlowWarningTime'),
        tempThresholdMax: validateValue('tempThresholdMax', settings.tempThresholdMax) ? settings.tempThresholdMax : getDefaultValue('tempThresholdMax'),
        tempThresholdMin: validateValue('tempThresholdMin', settings.tempThresholdMin) ? settings.tempThresholdMin : getDefaultValue('tempThresholdMin')
      };
    },

    async updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>) {
      const properties = await this.getDeviceProperties(deviceId);
      
      for (const [key, value] of Object.entries(settings)) {
        // Validate value before updating
        if (!validateValue(key, value)) {
          throw new Error(`Invalid value for ${key}: ${value}`);
        }
        
        const property = properties.find(p => p.name === key);
        if (property) {
          await this.updateProperty(deviceId, property.id, value);
        }
      }
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      await makeRequest(`devices/${deviceId}/properties/${propertyId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
    }
  };

  return client;
} 