export interface ArduinoDevice {
  id: string;
  name: string;
  type?: string;
  serial?: string;
  fqbn?: string;
  events?: any[];
  properties?: ArduinoProperty[];
  device_status: 'ONLINE' | 'OFFLINE';
  connection_type?: string;
  online?: boolean;
}

export interface ArduinoProperty {
  id: string;
  name: string;
  type: 'String' | 'Float' | 'Integer';
  value: any;
  updated_at: string;
  variable_name?: string;
  permission?: string;
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

// Property name types for type safety
export type PropertyName = 
  | 'alertEmail'
  | 'cloudflowrate'
  | 'cloudhumidity'
  | 'cloudtemp'
  | 'flowThresholdMin'
  | 'humidityThresholdMax'
  | 'humidityThresholdMin'
  | 'lastUpdateTime'
  | 'noFlowCriticalTime'
  | 'noFlowWarningTime'
  | 'tempThresholdMax'
  | 'tempThresholdMin';

// Property type mapping
export const PropertyTypes: Record<PropertyName, 'String' | 'Float' | 'Integer'> = {
  alertEmail: 'String',
  cloudflowrate: 'Float',
  cloudhumidity: 'Float',
  cloudtemp: 'Float',
  flowThresholdMin: 'Float',
  humidityThresholdMax: 'Float',
  humidityThresholdMin: 'Float',
  lastUpdateTime: 'String',
  noFlowCriticalTime: 'Integer',
  noFlowWarningTime: 'Integer',
  tempThresholdMax: 'Float',
  tempThresholdMin: 'Float'
};

// Property units and formatting
export const PropertyUnits: Partial<Record<PropertyName, string>> = {
  cloudtemp: '°C',
  cloudhumidity: '%',
  cloudflowrate: 'L/min',
  flowThresholdMin: 'L/min',
  humidityThresholdMax: '%',
  humidityThresholdMin: '%',
  tempThresholdMax: '°C',
  tempThresholdMin: '°C',
  noFlowCriticalTime: 'min',
  noFlowWarningTime: 'min'
};

// Default values for properties
export const DefaultValues: Record<PropertyName, any> = {
  alertEmail: '',
  cloudflowrate: 0,
  cloudhumidity: 0,
  cloudtemp: 0,
  flowThresholdMin: 5.0,
  humidityThresholdMax: 70.0,
  humidityThresholdMin: 30.0,
  lastUpdateTime: new Date().toISOString(),
  noFlowCriticalTime: 3,
  noFlowWarningTime: 2,
  tempThresholdMax: 35.0,
  tempThresholdMin: 5.0
};

export function getDefaultValue(propertyName: PropertyName): any {
  return DefaultValues[propertyName];
}

// Helper functions
export function formatValue(name: PropertyName, value: any): string {
  if (value === null || value === undefined) return 'Not set';

  switch (name) {
    case 'lastUpdateTime':
      return new Date(value).toLocaleString();
    case 'alertEmail':
      return value || 'Not set';
    default:
      const unit = PropertyUnits[name];
      return unit ? `${value}${unit}` : String(value);
  }
}

export function getPropertyGroup(name: PropertyName): string {
  if (name.startsWith('cloud')) return 'Measurements';
  if (name.includes('Threshold')) return 'Thresholds';
  if (name.includes('Time')) return 'Timing';
  return 'Configuration';
}

export function groupProperties(properties: ArduinoProperty[]): { group: string; properties: ArduinoProperty[] }[] {
  const groups = new Map<string, ArduinoProperty[]>();

  properties.forEach(prop => {
    const group = getPropertyGroup(prop.name as PropertyName);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(prop);
  });

  return Array.from(groups.entries()).map(([group, props]) => ({
    group,
    properties: props
  }));
}

export function validateValue(name: PropertyName, value: any): boolean {
  const type = PropertyTypes[name];
  
  switch (type) {
    case 'String':
      if (name === 'alertEmail') {
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return typeof value === 'string';
      
    case 'Float':
      const numValue = parseFloat(value);
      return !isNaN(numValue) && isFinite(numValue);
      
    case 'Integer':
      const intValue = parseInt(value, 10);
      return !isNaN(intValue) && Number.isInteger(intValue) && intValue >= 0;
      
    default:
      return true;
  }
} 