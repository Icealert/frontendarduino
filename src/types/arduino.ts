export interface ArduinoDevice {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  properties: ArduinoProperty[];
}

export interface ArduinoProperty {
  id: string;
  name: string;
  value: any;
  type: 'temperature' | 'humidity' | 'flowRate' | string;
  unit?: string;
  timestamp: string;
}

export interface DeviceSettings {
  temperatureRange: {
    min: number;
    max: number;
  };
  humidityRange: {
    min: number;
    max: number;
  };
  flowRateThreshold: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
  deviceId: string;
} 