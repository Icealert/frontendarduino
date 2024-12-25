import axios from 'axios';
import { ArduinoDevice, ArduinoProperty, DeviceSettings } from '../types/arduino';

const API_BASE_URL = 'https://api2.arduino.cc/iot/v2';
const AUTH_URL = 'https://api2.arduino.cc/iot/v1/clients/token';

// Create an Axios instance with default config
const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

class ArduinoApiClient {
  private accessToken: string | null = null;
  private clientId: string;
  private clientSecret: string;
  private knownDeviceIds: string[];

  constructor(clientId: string, clientSecret: string, deviceIds: string[] = []) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.knownDeviceIds = deviceIds;
    console.log('Initializing Arduino API Client...');
    console.log('Known device IDs:', deviceIds);
  }

  private async authenticate() {
    try {
      console.log('Starting authentication...');
      console.log('Client ID:', this.clientId);
      console.log('Using auth URL:', AUTH_URL);

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('audience', 'https://api2.arduino.cc/iot');

      console.log('Sending authentication request...');
      const response = await axios.post(AUTH_URL, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      console.log('Authentication successful!');
      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error: any) {
      console.error('Authentication failed!');
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw new Error('Failed to authenticate with Arduino IoT Cloud');
    }
  }

  private get headers() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async ensureAuthenticated() {
    if (!this.accessToken) {
      console.log('No access token found, authenticating...');
      await this.authenticate();
    }
    return this.accessToken;
  }

  async getDevices(): Promise<ArduinoDevice[]> {
    try {
      console.log('Getting devices...');
      await this.ensureAuthenticated();
      
      // If we have known device IDs, fetch them specifically
      if (this.knownDeviceIds.length > 0) {
        console.log('Fetching known devices:', this.knownDeviceIds);
        const devices = await Promise.all(
          this.knownDeviceIds.map(id => this.getDeviceById(id))
        );
        return devices.filter((device): device is ArduinoDevice => device !== null);
      }
      
      // Otherwise, fetch all devices
      const url = `${API_BASE_URL}/things`;
      console.log('Fetching all devices from:', url);
      
      const response = await axiosInstance.get(url, {
        headers: this.headers,
        params: {
          show_properties: true,
        }
      });

      console.log('Devices response:', response.data);
      
      return Array.isArray(response.data) ? response.data.map((device: any) => ({
        id: device.id,
        name: device.name || 'Unnamed Device',
        status: device.connection_status || 'offline',
        lastSeen: device.last_activity_at || null,
        properties: device.properties || []
      })) : [];
    } catch (error: any) {
      console.error('Error fetching devices:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      return [];
    }
  }

  private async getDeviceById(deviceId: string): Promise<ArduinoDevice | null> {
    try {
      await this.ensureAuthenticated();
      const url = `${API_BASE_URL}/things/${deviceId}`;
      console.log(`Fetching device ${deviceId} from:`, url);
      
      const response = await axiosInstance.get(url, {
        headers: this.headers
      });

      const device = response.data;
      return {
        id: device.id,
        name: device.name || 'Unnamed Device',
        status: device.connection_status || 'offline',
        lastSeen: device.last_activity_at || null,
        properties: device.properties || []
      };
    } catch (error: any) {
      console.error(`Error fetching device ${deviceId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return null;
    }
  }

  async getDeviceProperties(deviceId: string): Promise<ArduinoProperty[]> {
    try {
      console.log(`Getting properties for device ${deviceId}...`);
      await this.ensureAuthenticated();
      
      const url = `${API_BASE_URL}/things/${deviceId}/properties`;
      console.log('Fetching properties from:', url);
      
      const response = await axiosInstance.get(url, { 
        headers: this.headers,
      });

      console.log('Properties response:', response.data);
      
      return Array.isArray(response.data) ? response.data.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        value: prop.last_value,
        type: prop.variable_type,
        unit: prop.unit,
        timestamp: prop.updated_at
      })) : [];
    } catch (error: any) {
      console.error('Error fetching device properties:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      return [];
    }
  }

  async updateDeviceSettings(
    deviceId: string,
    propertyId: string,
    settings: Partial<DeviceSettings>
  ): Promise<void> {
    try {
      await this.ensureAuthenticated();
      const url = `${API_BASE_URL}/things/${deviceId}/properties/${propertyId}`;
      console.log('Updating settings at:', url);
      
      await axiosInstance.put(url, 
        { value: settings },
        { headers: this.headers }
      );
    } catch (error: any) {
      console.error('Error updating device settings:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<'online' | 'offline'> {
    try {
      await this.ensureAuthenticated();
      const url = `${API_BASE_URL}/things/${deviceId}`;
      console.log('Fetching device status from:', url);
      
      const response = await axiosInstance.get(url, 
        { headers: this.headers }
      );
      return response.data.connection_status || 'offline';
    } catch (error: any) {
      console.error('Error fetching device status:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      return 'offline';
    }
  }

  async updateProperty(deviceId: string, propertyName: string, value: any): Promise<void> {
    try {
      await this.ensureAuthenticated();
      
      // First, get the properties to find the property ID
      const properties = await this.getDeviceProperties(deviceId);
      const property = properties.find(p => p.name === propertyName);
      
      if (!property) {
        throw new Error(`Property ${propertyName} not found`);
      }

      console.log(`Updating property ${propertyName} (ID: ${property.id}) for device ${deviceId} with value:`, value);
      
      // Format the value based on the property type
      let formattedValue = value;
      if (propertyName === 'alertEmail') {
        formattedValue = String(value); // Ensure email is sent as string
      } else if (typeof value === 'number') {
        formattedValue = Number(value); // Ensure numbers are sent as numbers
      }

      const url = `${API_BASE_URL}/things/${deviceId}/properties/${property.id}/publish`;
      console.log('Sending update request to:', url);
      console.log('Request payload:', { value: formattedValue });
      
      const response = await axiosInstance.put(
        url,
        { value: formattedValue },
        { headers: this.headers }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update property: ${response.statusText}`);
      }

      console.log('Property updated successfully:', response.data);
    } catch (error: any) {
      console.error('Error updating property:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  }
}

export const createArduinoApiClient = (clientId: string, clientSecret: string) => {
  if (!clientId || !clientSecret) {
    console.error('Missing credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
    throw new Error('Missing Arduino IoT Cloud credentials');
  }

  // Get device IDs from environment variables
  const deviceIds = [
    process.env.NEXT_PUBLIC_ARDUINO_DEVICE_ID_1,
    process.env.NEXT_PUBLIC_ARDUINO_DEVICE_ID_2
  ].filter((id): id is string => typeof id === 'string');

  return new ArduinoApiClient(clientId, clientSecret, deviceIds);
};

export type { ArduinoApiClient }; 