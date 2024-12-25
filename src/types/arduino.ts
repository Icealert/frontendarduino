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
  temperatureRange: {
    min: number;
    max: number;
  };
  humidityRange: {
    min: number;
    max: number;
  };
  flowRateThreshold: number;
  noFlowWarningTime: number;
  noFlowCriticalTime: number;
  alertEmail?: string;
}

export interface EditableValues {
  [key: string]: any;
}

// Helper functions
export function isEditable(propertyName: string): boolean {
  const editableProperties = [
    'tempThresholdMin', 'tempThresholdMax',
    'humidityThresholdMin', 'humidityThresholdMax',
    'flowThresholdMin',
    'noFlowWarningTime', 'noFlowCriticalTime',
    'alertEmail'
  ];
  return editableProperties.includes(propertyName);
}

export function getInputType(propertyName: string): string {
  if (propertyName === 'alertEmail') return 'email';
  if (propertyName.includes('Time')) return 'number';
  if (propertyName.includes('temp') || propertyName.includes('humidity') || propertyName.includes('flow')) return 'number';
  return 'text';
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
    default:
      return String(value);
  }
}

export function getStatusColor(propertyName: string, value: any): string {
  switch (propertyName) {
    case 'deviceStatus':
      return value.toLowerCase() === 'safe' 
        ? 'text-teal-300' 
        : value.toLowerCase() === 'warning'
          ? 'text-amber-300'
          : 'text-rose-300';
    case 'powerStatus':
      return value.toLowerCase() === 'stable' ? 'text-teal-300' : 'text-amber-300';
    case 'anomaliesDetected':
      return value ? 'text-rose-300' : 'text-teal-300';
    default:
      return 'text-indigo-100';
  }
}

export function groupProperties(properties: ArduinoProperty[]) {
  const groups = {
    measurements: ['cloudtemp', 'cloudhumidity', 'cloudflowrate'],
    thresholds: ['tempThresholdMin', 'tempThresholdMax', 'humidityThresholdMin', 'humidityThresholdMax', 'flowThresholdMin'],
    timing: ['noFlowWarningTime', 'noFlowCriticalTime'],
    status: ['deviceStatus', 'powerStatus', 'anomaliesDetected'],
    config: ['alertEmail'],
    system: ['lastUpdateTime']
  };

  return Object.entries(groups).map(([group, propertyNames]) => ({
    group,
    properties: properties.filter(p => propertyNames.includes(p.name))
  }));
} 