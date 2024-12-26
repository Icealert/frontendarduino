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

  // Safely convert to array
  let properties: any[] = [];
  try {
    if (Array.isArray(rawProperties)) {
      properties = rawProperties;
    } else if (typeof rawProperties === 'object' && rawProperties !== null) {
      properties = Object.values(rawProperties);
    }
  } catch (error) {
    console.error('Error converting properties to array:', error);
    return [];
  }

  // Log converted array
  console.log('Properties array:', JSON.stringify(properties, null, 2));

  // Validate properties array
  if (!Array.isArray(properties)) {
    console.warn('Properties could not be converted to array:', rawProperties);
    return [];
  }

  // Initialize groups
  const groupMap = new Map<string, ArduinoProperty[]>([
    ['Measurements', []],
    ['Thresholds', []],
    ['Timing', []],
    ['Configuration', []]
  ]);

  // Process each property with validation
  properties.forEach((prop, index) => {
    try {
      // Validate property object
      if (!prop || typeof prop !== 'object') {
        console.warn(`Invalid property at index ${index}:`, prop);
        return;
      }

      // Validate required fields
      if (!prop.name || typeof prop.name !== 'string') {
        console.warn(`Property at index ${index} missing valid name:`, prop);
        return;
      }

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

      // Add to group
      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }

      // Clean property object before adding
      const cleanProperty: ArduinoProperty = {
        id: prop.id || `generated_${index}`,
        name: prop.name,
        type: prop.type || 'String',
        value: prop.value,
        last_value: prop.last_value,
        updated_at: prop.updated_at,
        variable_name: prop.variable_name
      };

      groupMap.get(group)!.push(cleanProperty);
      console.log(`Added property to ${group}:`, JSON.stringify(cleanProperty, null, 2));

    } catch (error) {
      console.error(`Error processing property at index ${index}:`, error, prop);
    }
  });

  // Build result array
  const result = Array.from(groupMap.entries())
    .filter(([_, props]) => props.length > 0)
    .map(([group, props]) => ({
      group,
      properties: props
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