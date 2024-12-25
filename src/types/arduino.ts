export interface ArduinoDevice {
  id: string;
  name: string;
  type?: string;
  serial?: string;
  fqbn?: string;
  events?: any[];
  properties?: ArduinoProperty[];
  device_status: 'ONLINE' | 'OFFLINE';
  thing?: {
    id: string;
    name: string;
    properties?: ArduinoProperty[];
  };
}

export interface ArduinoProperty {
  id: string;
  name: string;
  type: string;
  value: any;
  persist: boolean;
  update_strategy: string;
  update_parameter: number;
  permission: string;
  variable_name: string;
  updated_at: string;
}

export interface DeviceSettings {
  alertEmail: string;
  cloudflowrate: number;
  cloudhumidity: number;
  cloudtemp: number;
  flowThresholdMin: number;
  humidityThresholdMax: number;
  humidityThresholdMin: number;
  lastUpdateTime: string;
  noFlowCriticalTime: number;
  noFlowWarningTime: number;
  tempThresholdMax: number;
  tempThresholdMin: number;
}

// Helper functions
export function isEditable(propertyName: string): boolean {
  const editableProperties = [
    'alertEmail',
    'flowThresholdMin',
    'humidityThresholdMax',
    'humidityThresholdMin',
    'noFlowCriticalTime',
    'noFlowWarningTime',
    'tempThresholdMax',
    'tempThresholdMin'
  ];
  return editableProperties.includes(propertyName);
}

export function getInputType(propertyName: string): string {
  switch (propertyName) {
    case 'alertEmail':
      return 'email';
    case 'lastUpdateTime':
      return 'datetime-local';
    case 'noFlowCriticalTime':
    case 'noFlowWarningTime':
      return 'number';
    case 'flowThresholdMin':
    case 'humidityThresholdMax':
    case 'humidityThresholdMin':
    case 'tempThresholdMax':
    case 'tempThresholdMin':
      return 'number';
    default:
      return 'text';
  }
}

export function getDefaultValue(propertyName: string): any {
  switch (propertyName) {
    case 'alertEmail':
      return '';
    case 'cloudflowrate':
    case 'cloudhumidity':
    case 'cloudtemp':
      return 0;
    case 'flowThresholdMin':
      return 5.0;
    case 'humidityThresholdMax':
      return 80.0;
    case 'humidityThresholdMin':
      return 20.0;
    case 'lastUpdateTime':
      return new Date().toISOString();
    case 'noFlowCriticalTime':
      return 5;
    case 'noFlowWarningTime':
      return 3;
    case 'tempThresholdMax':
      return 30.0;
    case 'tempThresholdMin':
      return 10.0;
    default:
      return null;
  }
}

export function validateValue(propertyName: string, value: any): boolean {
  switch (propertyName) {
    case 'alertEmail':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'cloudflowrate':
    case 'cloudhumidity':
    case 'cloudtemp':
      return typeof value === 'number' && !isNaN(value);
    case 'flowThresholdMin':
    case 'humidityThresholdMax':
    case 'humidityThresholdMin':
    case 'tempThresholdMax':
    case 'tempThresholdMin':
      return typeof value === 'number' && !isNaN(value) && Number.isFinite(value);
    case 'lastUpdateTime':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    case 'noFlowCriticalTime':
    case 'noFlowWarningTime':
      return typeof value === 'number' && Number.isInteger(value) && value >= 0;
    default:
      return true;
  }
}

export function formatValue(name: string, value: any): string {
  switch (name) {
    case 'cloudtemp':
    case 'tempThresholdMin':
    case 'tempThresholdMax':
      return `${value}°C`;
    case 'cloudhumidity':
    case 'humidityThresholdMin':
    case 'humidityThresholdMax':
      return `${value}%`;
    case 'cloudflowrate':
    case 'flowThresholdMin':
      return `${value} L/min`;
    case 'noFlowWarningTime':
    case 'noFlowCriticalTime':
      return `${value} min`;
    case 'lastUpdateTime':
      return new Date(value).toLocaleString();
    case 'alertEmail':
      return value || 'Not set';
    default:
      return String(value);
  }
}

export function getStatusColor(propertyName: string, value: any): string {
  // Measurement variables
  if (['cloudtemp', 'cloudhumidity', 'cloudflowrate'].includes(propertyName)) {
    return 'text-blue-300';
  }
  // Threshold variables
  if (propertyName.includes('Threshold')) {
    return 'text-amber-300';
  }
  // Time variables
  if (propertyName.includes('Time')) {
    return 'text-indigo-300';
  }
  // Email
  if (propertyName === 'alertEmail') {
    return value ? 'text-teal-300' : 'text-rose-300';
  }
  return 'text-slate-300';
}

export function groupProperties(properties: ArduinoProperty[]) {
  const groups = {
    measurements: ['cloudtemp', 'cloudhumidity', 'cloudflowrate'],
    thresholds: [
      'tempThresholdMin', 
      'tempThresholdMax', 
      'humidityThresholdMin', 
      'humidityThresholdMax', 
      'flowThresholdMin'
    ],
    timing: ['noFlowWarningTime', 'noFlowCriticalTime', 'lastUpdateTime'],
    config: ['alertEmail']
  };

  return Object.entries(groups).map(([group, propertyNames]) => ({
    group,
    properties: properties.filter(p => propertyNames.includes(p.name))
  }));
}

export function getStepValue(propertyName: string): string {
  switch (propertyName) {
    case 'cloudtemp':
    case 'tempThresholdMin':
    case 'tempThresholdMax':
      return '0.1'; // Temperature in 0.1°C steps
    case 'cloudhumidity':
    case 'humidityThresholdMin':
    case 'humidityThresholdMax':
      return '1'; // Humidity in 1% steps
    case 'cloudflowrate':
    case 'flowThresholdMin':
      return '0.1'; // Flow rate in 0.1 L/min steps
    case 'noFlowWarningTime':
    case 'noFlowCriticalTime':
      return '1'; // Time in 1 minute steps
    default:
      return 'any';
  }
} 