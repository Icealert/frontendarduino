export interface ArduinoProperty {
  id: string;
  name: string;
  value: any;
  type: string;
  timestamp?: string;
}

export interface ArduinoDevice {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  properties?: ArduinoProperty[];
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
    default:
      return 'number';
  }
}

export function getStepValue(propertyName: string): string {
  if (propertyName.includes('temp')) return '0.1';
  if (propertyName.includes('humidity')) return '1';
  if (propertyName.includes('flow')) return '0.1';
  if (propertyName.includes('Time')) return '1';
  return 'any';
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