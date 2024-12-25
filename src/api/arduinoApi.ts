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

export async function createArduinoApiClient(clientId: string, clientSecret: string): Promise<ArduinoApiClient> {
  console.log('Creating Arduino API client...');
  
  // Get access token
  console.log('Requesting access token...');
  const formData = new URLSearchParams();
  formData.append('grant_type', 'client_credentials');
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('audience', 'https://api2.arduino.cc/iot');

  const tokenResponse = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('Authentication failed:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      error: errorData,
      requestBody: Object.fromEntries(formData.entries())
    });
    throw new Error(`Failed to authenticate with Arduino IoT Cloud: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error('No access token in response:', tokenData);
    throw new Error('No access token received from Arduino IoT Cloud');
  }

  console.log('Successfully obtained access token');

  // Helper function to make authenticated requests
  async function makeRequest(path: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${path}`;
    console.log(`Making request to ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Arduino API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  return {
    async getDevices() {
      console.log('Fetching devices...');
      const data = await makeRequest('/things');
      console.log('Raw devices data:', data);
      
      const devices = data.map((thing: any) => ({
        id: thing.id,
        name: thing.name,
        status: thing.connection_status || 'OFFLINE',
        properties: thing.properties || [],
      }));
      
      console.log('Processed devices:', devices);
      return devices;
    },

    async getDeviceProperties(deviceId: string) {
      console.log(`Fetching properties for device ${deviceId}...`);
      const data = await makeRequest(`/things/${deviceId}/properties`);
      console.log(`Properties for device ${deviceId}:`, data);
      return data;
    },

    async updateProperty(deviceId: string, propertyId: string, value: any) {
      console.log(`Updating property ${propertyId} for device ${deviceId} with value:`, value);
      await makeRequest(`/things/${deviceId}/properties/${propertyId}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      console.log('Property updated successfully');
    },

    async getDeviceSettings(deviceId: string) {
      console.log(`Fetching settings for device ${deviceId}...`);
      const properties = await this.getDeviceProperties(deviceId);
      
      const settings = {
        temperatureRange: {
          min: properties.find(p => p.name === 'tempThresholdMin')?.value || 0,
          max: properties.find(p => p.name === 'tempThresholdMax')?.value || 30,
        },
        humidityRange: {
          min: properties.find(p => p.name === 'humidityThresholdMin')?.value || 0,
          max: properties.find(p => p.name === 'humidityThresholdMax')?.value || 100,
        },
        flowRateThreshold: properties.find(p => p.name === 'flowThresholdMin')?.value || 0,
        noFlowWarningTime: properties.find(p => p.name === 'noFlowWarningTime')?.value || 5,
        noFlowCriticalTime: properties.find(p => p.name === 'noFlowCriticalTime')?.value || 10,
        alertEmail: properties.find(p => p.name === 'alertEmail')?.value,
      };
      
      console.log(`Settings for device ${deviceId}:`, settings);
      return settings;
    },

    async updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>) {
      console.log(`Updating settings for device ${deviceId}:`, settings);
      const updates = [];
      
      if (settings.temperatureRange) {
        updates.push(
          this.updateProperty(deviceId, 'tempThresholdMin', settings.temperatureRange.min),
          this.updateProperty(deviceId, 'tempThresholdMax', settings.temperatureRange.max)
        );
      }
      
      if (settings.humidityRange) {
        updates.push(
          this.updateProperty(deviceId, 'humidityThresholdMin', settings.humidityRange.min),
          this.updateProperty(deviceId, 'humidityThresholdMax', settings.humidityRange.max)
        );
      }
      
      if (settings.flowRateThreshold !== undefined) {
        updates.push(
          this.updateProperty(deviceId, 'flowThresholdMin', settings.flowRateThreshold)
        );
      }
      
      if (settings.noFlowWarningTime !== undefined) {
        updates.push(
          this.updateProperty(deviceId, 'noFlowWarningTime', settings.noFlowWarningTime)
        );
      }
      
      if (settings.noFlowCriticalTime !== undefined) {
        updates.push(
          this.updateProperty(deviceId, 'noFlowCriticalTime', settings.noFlowCriticalTime)
        );
      }
      
      if (settings.alertEmail !== undefined) {
        updates.push(
          this.updateProperty(deviceId, 'alertEmail', settings.alertEmail)
        );
      }
      
      await Promise.all(updates);
      console.log('All settings updated successfully');
    },
  };
} 