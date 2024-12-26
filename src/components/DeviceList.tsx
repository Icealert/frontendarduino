'use client';

import { useState } from 'react';
import { ArduinoDevice, ArduinoProperty, formatValue, groupProperties, PropertyName } from '../types/arduino';

interface DeviceListProps {
  devices: ArduinoDevice[];
  selectedDevice?: ArduinoDevice;
  onDeviceSelect: (device: ArduinoDevice) => void;
}

interface DeviceMetrics {
  flowrate: string;
  humidity: string;
  temperature: string;
  lastUpdate: string | null;
}

function getDeviceMetrics(device: ArduinoDevice): DeviceMetrics {
  // Ensure we have a valid device
  if (!device) {
    console.warn('Device is undefined or null');
    return {
      flowrate: 'No data',
      humidity: 'No data',
      temperature: 'No data',
      lastUpdate: null
    };
  }

  // Log raw device data for debugging
  console.log('Raw device data:', JSON.stringify(device, null, 2));

  // Safely extract properties array
  let properties: any[] = [];
  try {
    if (device.properties) {
      if (Array.isArray(device.properties)) {
        properties = device.properties;
      } else if (typeof device.properties === 'object') {
        properties = Object.values(device.properties);
      }
    }
  } catch (error) {
    console.error('Error extracting properties:', error);
  }

  // Log extracted properties
  console.log('Extracted properties:', JSON.stringify(properties, null, 2));
  
  // Safe property lookup function
  const findPropertyValue = (propertyName: PropertyName): string => {
    try {
      // Log search attempt
      console.log(`Searching for property: ${propertyName}`);

      // Find property with matching name, with validation
      const property = properties.find(p => {
        if (!p || typeof p !== 'object') {
          console.warn('Invalid property object:', p);
          return false;
        }

        const nameMatch = p.name === propertyName || p.variable_name === propertyName;
        if (nameMatch) {
          console.log('Found matching property:', JSON.stringify(p, null, 2));
        }
        return nameMatch;
      });

      if (!property) {
        console.log(`No property found with name: ${propertyName}`);
        return 'No data';
      }

      // Get value with validation
      const value = property.last_value ?? property.value;
      if (value === undefined || value === null) {
        console.log(`No value found for property: ${propertyName}`);
        return 'No data';
      }

      // Format and return value
      const formattedValue = formatValue(propertyName, value);
      console.log(`Formatted value for ${propertyName}:`, formattedValue);
      return formattedValue;

    } catch (error) {
      console.error(`Error processing property ${propertyName}:`, error);
      return 'No data';
    }
  };

  // Get last update time with validation
  let lastUpdate: string | null = null;
  try {
    const validProperties = properties.filter(p => p && typeof p === 'object' && p.updated_at);
    const lastProperty = validProperties[0];
    
    if (lastProperty?.updated_at) {
      lastUpdate = new Date(lastProperty.updated_at).toLocaleString();
      console.log('Last update time:', lastUpdate);
    } else {
      console.log('No valid update time found');
    }
  } catch (error) {
    console.error('Error getting last update time:', error);
  }

  // Build metrics object
  const metrics = {
    flowrate: findPropertyValue('cloudflowrate'),
    humidity: findPropertyValue('cloudhumidity'),
    temperature: findPropertyValue('cloudtemp'),
    lastUpdate
  };

  // Log final metrics
  console.log('Final metrics:', metrics);
  return metrics;
}

export default function DeviceList({ devices, selectedDevice, onDeviceSelect }: DeviceListProps) {
  const [error, setError] = useState<string | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  if (error) {
    return (
      <div className="p-4 text-rose-300">
        Error: {error}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">🔍</div>
        <div className="text-slate-300">No devices found</div>
      </div>
    );
  }

  const handleDeviceClick = (device: ArduinoDevice) => {
    onDeviceSelect(device);
  };

  const handleInfoClick = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device, index) => {
        const metrics = getDeviceMetrics(device);
        return (
          <div 
            key={device.id}
            className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-[1.02] ${
              selectedDevice?.id === device.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Device Header */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => handleDeviceClick(device)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Device {index + 1}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{device.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    device.device_status === 'ONLINE' 
                      ? 'bg-teal-500/20 text-teal-300' 
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {device.device_status === 'ONLINE' ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💧</div>
                  <div className="text-sm font-medium text-slate-300">Flow Rate</div>
                  <div className="text-slate-400 mt-1">{metrics.flowrate}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💨</div>
                  <div className="text-sm font-medium text-slate-300">Humidity</div>
                  <div className="text-slate-400 mt-1">{metrics.humidity}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🌡️</div>
                  <div className="text-sm font-medium text-slate-300">Temperature</div>
                  <div className="text-slate-400 mt-1">{metrics.temperature}</div>
                </div>
              </div>

              {/* Last Update & Actions */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  {metrics.lastUpdate ? (
                    <>🕒 Last update: {metrics.lastUpdate}</>
                  ) : (
                    'No data available'
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    onClick={(e) => handleInfoClick(e, device.id)}
                    title="Show device info"
                  >
                    <span className="sr-only">Show device info</span>
                    <svg 
                      className={`w-5 h-5 text-slate-300 transform transition-transform ${
                        expandedDeviceId === device.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeviceClick(device);
                    }}
                    title="View details"
                  >
                    <span className="sr-only">View details</span>
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Device Info */}
            {expandedDeviceId === device.id && device.properties && (
              <div className="border-t border-slate-700 bg-slate-800/50">
                <div className="p-4 space-y-6">
                  {/* Device Properties */}
                  {groupProperties(device.properties).map(({ group, properties }) => (
                    <div key={group} className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                        {group}
                      </h4>
                      <div className="bg-slate-700/30 rounded-lg p-3 space-y-3">
                        {properties.map((property: any) => {
                          // Skip invalid properties
                          if (!property || !property.name) return null;

                          // Get the display value safely
                          const value = property.last_value ?? property.value;
                          const displayValue = value !== undefined && value !== null
                            ? formatValue(property.name as any, value)
                            : 'No data';

                          return (
                            <div key={property.id} className="flex items-center justify-between">
                              <span className="text-slate-300">{property.name}</span>
                              <span className="text-slate-400">{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Device Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      Device Details
                    </h4>
                    <div className="bg-slate-700/30 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Device ID</span>
                        <span className="text-slate-400 font-mono text-sm">{device.id}</span>
                      </div>
                      {device.connection_type && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Connection</span>
                          <span className="text-slate-400">{device.connection_type}</span>
                        </div>
                      )}
                      {device.data_retention_days && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Data Retention</span>
                          <span className="text-slate-400">{device.data_retention_days} days</span>
                        </div>
                      )}
                      {device.prototype && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Prototype</span>
                          <span className="text-slate-400">{device.prototype.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 