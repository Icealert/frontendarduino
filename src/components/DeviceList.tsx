'use client';

import { useState, useEffect } from 'react';

interface DeviceProperty {
  id: string;
  name: string;
  value: any;
  type: string;
  timestamp?: string;
}

interface Device {
  id: string;
  name: string;
  status: string;
  properties?: DeviceProperty[];
}

// Add new interface for editable values
interface EditableValues {
  [key: string]: any;
}

// Helper function to check if property is editable
function isEditable(propertyName: string): boolean {
  const editableProperties = [
    'tempThresholdMin', 'tempThresholdMax',
    'humidityThresholdMin', 'humidityThresholdMax',
    'flowThresholdMin',
    'noFlowWarningTime', 'noFlowCriticalTime',
    'alertEmail'
  ];
  return editableProperties.includes(propertyName);
}

// Helper function to get input type based on property name
function getInputType(propertyName: string): string {
  if (propertyName === 'alertEmail') return 'email';
  if (propertyName.includes('Time')) return 'number';
  if (propertyName.includes('temp') || propertyName.includes('humidity') || propertyName.includes('flow')) return 'number';
  return 'text';
}

// Helper function to get input step value
function getStepValue(propertyName: string): string {
  if (propertyName.includes('temp')) return '0.1';
  if (propertyName.includes('humidity')) return '1';
  if (propertyName.includes('flow')) return '0.1';
  if (propertyName.includes('Time')) return '1';
  return 'any';
}

// Helper function to format values based on their type
function formatValue(name: string, value: any): string {
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

// Helper function to group properties by category
function groupProperties(properties: DeviceProperty[]) {
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

// Helper function to get status color
function getStatusColor(propertyName: string, value: any): string {
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

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [editableValues, setEditableValues] = useState<EditableValues>({});
  const [saving, setSaving] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    let isMounted = true;

    async function fetchDevices() {
      try {
        setLoading(true);
        const response = await fetch('/api/arduino');
        
        // Check if component is still mounted
        if (!isMounted) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch devices');
        }

        setDevices(data.devices || []);
        setError(null);
      } catch (err: any) {
        // Check if component is still mounted
        if (!isMounted) return;
        
        console.error('Error fetching devices:', err);
        setError(err.message);
      } finally {
        // Check if component is still mounted
        if (!isMounted) return;
        
        setLoading(false);
      }
    }

    // Initial fetch
    fetchDevices();

    // Set up auto-refresh every 5 minutes (300000 ms)
    const interval = setInterval(fetchDevices, 300000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle input change
  const handleInputChange = (deviceId: string, propertyName: string, value: any) => {
    setEditableValues(prev => ({
      ...prev,
      [`${deviceId}-${propertyName}`]: value
    }));
  };

  // Handle save
  const handleSave = async (deviceId: string, propertyName: string, value: any) => {
    try {
      setSaving(prev => ({ ...prev, [`${deviceId}-${propertyName}`]: true }));
      
      // Format value based on property type
      let formattedValue = value;
      if (propertyName === 'alertEmail') {
        formattedValue = String(value).trim();
      } else if (propertyName.includes('Time')) {
        formattedValue = parseInt(value);
      } else {
        formattedValue = parseFloat(value);
      }

      const response = await fetch('/api/arduino/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          propertyName,
          value: formattedValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update value');
      }

      // Update local state to reflect the change
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.id === deviceId) {
            return {
              ...device,
              properties: device.properties?.map(prop => 
                prop.name === propertyName ? { ...prop, value: formattedValue } : prop
              )
            };
          }
          return device;
        })
      );

      // Clear the editable value
      setEditableValues(prev => {
        const newValues = { ...prev };
        delete newValues[`${deviceId}-${propertyName}`];
        return newValues;
      });
    } catch (err: any) {
      console.error('Error saving value:', err);
      setError('Failed to save value. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [`${deviceId}-${propertyName}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((n) => (
          <div key={n} className="animate-pulse">
            <div className="bg-indigo-900/30 backdrop-blur-lg rounded-xl border border-indigo-500/20 p-4">
              <div className="flex justify-between">
                <div className="h-4 bg-indigo-500/20 rounded-full w-1/4"></div>
                <div className="h-4 bg-indigo-500/20 rounded-full w-1/6"></div>
              </div>
              <div className="h-3 bg-indigo-500/20 rounded-full w-1/3 mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4">
        <div className="flex items-center space-x-3 text-rose-100 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-medium">Error Loading Devices</h3>
        </div>
        <p className="text-rose-200/90 text-sm ml-8">{error}</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-indigo-300/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-indigo-100 mb-2">No Devices Found</h3>
        <p className="text-indigo-200/80">No devices were found in your IceAlert system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map(device => (
        <div 
          key={device.id}
          className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg border border-indigo-500/20 rounded-xl overflow-hidden transition-all duration-300 hover:from-indigo-800/50 hover:to-indigo-700/50 shadow-lg hover:shadow-indigo-500/10"
        >
          {/* Device Header */}
          <button 
            onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
            className="w-full p-5 flex items-center justify-between hover:bg-indigo-700/20 transition-colors duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full shadow-lg ring-2 ring-offset-2 ring-offset-indigo-900 ${
                device.status === 'ONLINE' 
                  ? 'bg-teal-400 ring-teal-400/50' 
                  : 'bg-indigo-400 ring-indigo-400/50'
              }`} />
              <div>
                <h3 className="font-semibold text-indigo-50 tracking-tight text-lg">
                  {device.name || 'Unnamed Device'}
                </h3>
                {device.properties?.find(p => p.name === 'deviceStatus')?.value && (
                  <span className={`text-sm ${getStatusColor('deviceStatus', device.properties.find(p => p.name === 'deviceStatus')?.value)}`}>
                    {device.properties.find(p => p.name === 'deviceStatus')?.value}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-1.5 text-sm rounded-full shadow-lg font-medium transition-colors duration-300 ${
                device.status === 'ONLINE' 
                  ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30 ring-1 ring-teal-400/20' 
                  : 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 ring-1 ring-indigo-400/20'
              }`}>
                {device.status?.toLowerCase() || 'unknown'}
              </span>
              <svg 
                className={`w-6 h-6 text-indigo-300 transition-transform duration-300 ${
                  expandedDevice === device.id ? 'transform rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Device Details */}
          {expandedDevice === device.id && device.properties && (
            <div className="border-t border-indigo-500/20 p-5 bg-indigo-900/40">
              <div className="text-sm text-indigo-100 mb-4 bg-indigo-800/40 p-3 rounded-xl border border-indigo-500/20 shadow-inner">
                <span className="font-medium text-indigo-200">Device ID:</span> {device.id}
              </div>
              
              <div className="space-y-6">
                {groupProperties(device.properties).map(group => 
                  group.properties.length > 0 && (
                    <div key={group.group} className="space-y-4">
                      <h4 className="text-base font-semibold text-indigo-100 tracking-tight capitalize">
                        {group.group}
                      </h4>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {group.properties.map(prop => (
                          <div 
                            key={prop.id}
                            className="bg-gradient-to-br from-indigo-800/40 to-indigo-900/40 backdrop-blur-lg rounded-xl border border-indigo-500/20 p-4 shadow-lg hover:from-indigo-800/50 hover:to-indigo-900/50 transition-colors duration-300"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold text-indigo-100 tracking-tight text-base mb-2">
                                  {prop.name}
                                </div>
                                <div className="text-sm text-indigo-200 bg-indigo-700/30 px-3 py-1.5 rounded-full shadow-inner">
                                  Type: {prop.type}
                                </div>
                              </div>
                              <div className="text-right">
                                {isEditable(prop.name) ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type={getInputType(prop.name)}
                                      value={editableValues[`${device.id}-${prop.name}`] ?? prop.value}
                                      onChange={(e) => handleInputChange(device.id, prop.name, e.target.value)}
                                      step={getStepValue(prop.name)}
                                      className="bg-indigo-700/30 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-indigo-100 w-32 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    />
                                    {editableValues[`${device.id}-${prop.name}`] !== undefined && (
                                      <button
                                        onClick={() => handleSave(device.id, prop.name, editableValues[`${device.id}-${prop.name}`])}
                                        disabled={saving[`${device.id}-${prop.name}`]}
                                        className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 px-3 py-1.5 rounded-lg border border-teal-400/30 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {saving[`${device.id}-${prop.name}`] ? 'Saving...' : 'Save'}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`font-bold tracking-tight text-lg mb-2 ${getStatusColor(prop.name, prop.value)}`}>
                                    {formatValue(prop.name, prop.value)}
                                  </div>
                                )}
                                {prop.timestamp && (
                                  <div className="text-sm text-indigo-200 bg-indigo-700/30 px-3 py-1.5 rounded-full shadow-inner">
                                    {new Date(prop.timestamp).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 