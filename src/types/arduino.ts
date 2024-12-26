export interface ArduinoDevice {
  id: string;
  name: string;
  type?: string;
  serial?: string;
  fqbn?: string;
  events?: any[];
  properties: any[];
  device_status: 'ONLINE' | 'OFFLINE';
  connection_type?: string;
  online?: boolean;
  user_id?: string;
  data_retention_days?: number;
  deviceId?: string;
  prototype?: {
    id: string;
    name: string;
  };
}

export interface ArduinoProperty {
  id: string;
  name: string;
  type: 'String' | 'Float' | 'Integer';
  value?: any;
  last_value?: any;
  updated_at?: string;
  last_update_at?: string;
  variable_name?: string;
  permission?: string;
  update_parameter?: number;
  update_strategy?: string;
  thing_id?: string;
  thing_name?: string;
  device_id?: string;
  channel?: {
    id: string;
    name: string;
  };
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
  if (value === null || value === undefined || value === '') return 'N/A';

  switch (name) {
    case 'lastUpdateTime':
      return value ? new Date(value).toLocaleString() : 'N/A';
    case 'alertEmail':
      return value || 'N/A';
    default:
      const unit = PropertyUnits[name];
      if (typeof value === 'number' && isNaN(value)) return 'N/A';
      return unit ? `${value}${unit}` : String(value);
  }
}

export function getPropertyGroup(name: PropertyName): string {
  if (name.startsWith('cloud')) return 'Measurements';
  if (name.includes('Threshold')) return 'Thresholds';
  if (name.includes('Time')) return 'Timing';
  return 'Configuration';
}

export function groupProperties(rawProperties: any): { group: string; properties: ArduinoProperty[] }[] {
  // Log raw input
  console.log('Raw properties input:', JSON.stringify(rawProperties, null, 2));

  // Safely convert to array and filter out non-object values
  let properties: any[] = [];
  try {
    if (Array.isArray(rawProperties)) {
      properties = rawProperties.filter(prop => 
        prop && 
        typeof prop === 'object' && 
        !Array.isArray(prop) &&
        typeof prop.name === 'string' &&
        prop.name.trim() !== ''
      );
    } else if (typeof rawProperties === 'object' && rawProperties !== null) {
      properties = Object.values(rawProperties).filter(prop => 
        prop && 
        typeof prop === 'object' && 
        !Array.isArray(prop) &&
        typeof prop.name === 'string' &&
        prop.name.trim() !== ''
      );
    }
  } catch (error) {
    console.error('Error processing properties:', error);
    return [];
  }

  // Log filtered array
  console.log('Filtered properties array:', JSON.stringify(properties, null, 2));

  // Initialize groups
  const groupMap = new Map<string, ArduinoProperty[]>([
    ['Measurements', []],
    ['Thresholds', []],
    ['Timing', []],
    ['Configuration', []]
  ]);

  // Process each property
  properties.forEach((prop) => {
    try {
      // Determine group
      let group = 'Configuration';
      const name = prop.name.toLowerCase();

      if (name.startsWith('cloud')) {
        group = 'Measurements';
      } else if (name.includes('threshold')) {
        group = 'Thresholds';
      } else if (name.includes('time')) {
        group = 'Timing';
      }

      // Clean property object before adding
      const cleanProperty: ArduinoProperty = {
        id: prop.id || `generated_${prop.name}`,
        name: prop.name,
        type: prop.type || 'String',
        value: prop.value ?? null,
        last_value: prop.last_value,
        updated_at: prop.updated_at,
        variable_name: prop.variable_name,
        permission: prop.permission,
        update_parameter: prop.update_parameter,
        update_strategy: prop.update_strategy,
        thing_id: prop.thing_id,
        thing_name: prop.thing_name,
        device_id: prop.device_id,
        channel: prop.channel
      };

      groupMap.get(group)!.push(cleanProperty);

    } catch (error) {
      console.error('Error processing property:', error, prop);
    }
  });

  // Build result array, only including groups with properties
  const result = Array.from(groupMap.entries())
    .filter(([_, props]) => props.length > 0)
    .map(([group, props]) => ({
      group,
      properties: props.sort((a, b) => a.name.localeCompare(b.name))
    }));

  // Log final result
  console.log('Grouped properties:', JSON.stringify(result, null, 2));
  return result;
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