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

  // Get base URL from window location or environment
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';

  console.log('Creating Arduino API client with base URL:', baseUrl);

  // Get access token from our token endpoint using absolute URL
  const tokenResponse = await fetch(`${baseUrl}/api/arduino/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': 'application/json'
    },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&audience=https://api2.arduino.cc/iot`
  });

  const responseText = await tokenResponse.text();
  console.log('Token response:', {
    status: tokenResponse.status,
    statusText: tokenResponse.statusText,
    body: responseText
  });

  if (!tokenResponse.ok) {
    let errorMessage = 'Failed to obtain access token';
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = tokenResponse.statusText;
    }
    throw new Error(errorMessage);
  }

  let tokenData: TokenResponse;
  try {
    tokenData = JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse token response:', error);
    throw new Error('Failed to parse token response');
  }

  if (!tokenData?.access_token) {
    throw new Error('No access token received from Arduino IoT Cloud');
  }

  console.log('Successfully obtained access token');

  const access_token = tokenData.access_token;

  const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${baseUrl}/api/arduino/proxy?endpoint=${encodeURIComponent(endpoint)}`;
    console.log('Making API request to:', url);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'authorization': `Bearer ${access_token}`,
        'content-type': 'application/json',
        'accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse API response:', error);
      throw new Error('Failed to parse API response');
    }
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