import { ArduinoDevice, ArduinoProperty, DeviceSettings, validateValue, getDefaultValue } from '@/types/arduino';

export interface ArduinoApiClient {
  getDevices(): Promise<ArduinoDevice[]>;
  getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]>;
  updateProperty(deviceId: string, propertyId: string, value: any): Promise<void>;
  getDeviceSettings(deviceId: string): Promise<DeviceSettings>;
  updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>): Promise<void>;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function createArduinoApiClient(clientId: string, clientSecret: string): Promise<ArduinoApiClient> {
  if (!clientId || !clientSecret) {
    throw new Error('Client ID and Client Secret are required');
  }

  // Create form data for token request
  const formData = new FormData();
  formData.append('grant_type', 'client_credentials');
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('audience', 'https://api2.arduino.cc/iot');

  // Get access token from our token endpoint
  const tokenResponse = await fetch('/api/arduino/token', {
    method: 'POST',
    body: formData
  });

  if (!tokenResponse.ok) {
    let errorMessage = 'Failed to obtain access token';
    try {
      const errorData = await tokenResponse.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = tokenResponse.statusText;
    }
    throw new Error(errorMessage);
  }

  let tokenData: TokenResponse;
  try {
    tokenData = await tokenResponse.json();
  } catch (error) {
    throw new Error('Failed to parse token response');
  }

  if (!tokenData?.access_token) {
    throw new Error('No access token received from Arduino IoT Cloud');
  }

  const access_token = tokenData.access_token;

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = '/api/arduino/proxy?endpoint=' + encodeURIComponent(endpoint);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
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