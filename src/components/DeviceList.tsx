'use client';

import { useState, useEffect } from 'react';
import { 
  ArduinoDevice, 
  ArduinoProperty,
  isEditable,
  getInputType,
  getStepValue,
  formatValue,
  getStatusColor,
  groupProperties
} from '../types/arduino';

interface DeviceListProps {
  client: any;
  onDeviceSelect: (device: ArduinoDevice) => void;
}

interface GroupedProperties {
  group: string;
  properties: ArduinoProperty[];
}

export default function DeviceList({ client, onDeviceSelect }: DeviceListProps) {
  const [devices, setDevices] = useState<ArduinoDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [editableValues, setEditableValues] = useState<{[key: string]: any}>({});
  const [saving, setSaving] = useState<{[key: string]: boolean}>({});
  const [deviceProperties, setDeviceProperties] = useState<{[key: string]: ArduinoProperty[]}>({});
  const [loadingProperties, setLoadingProperties] = useState<{[key: string]: boolean}>({});
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchDevices();
  }, [client]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arduino');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setDevices(data.devices || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceProperties = async (deviceId: string) => {
    if (deviceProperties[deviceId]) return; // Already fetched

    try {
      setLoadingProperties(prev => ({ ...prev, [deviceId]: true }));
      const response = await fetch(`/api/arduino/properties/${deviceId}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDeviceProperties(prev => ({
        ...prev,
        [deviceId]: data.properties || []
      }));
    } catch (err) {
      console.error('Failed to fetch device properties:', err);
      setError('Failed to fetch device properties');
    } finally {
      setLoadingProperties(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleDeviceClick = async (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId);
    if (deviceId !== expandedDevice) {
      await fetchDeviceProperties(deviceId);
    }
  };

  const handlePropertyChange = async (deviceId: string, propertyName: string, value: any) => {
    setEditableValues(prev => ({
      ...prev,
      [propertyName]: value
    }));
  };

  const handleSaveChanges = async (deviceId: string) => {
    try {
      setSaving(prev => ({ ...prev, deviceId: true }));
      
      // Get all changed properties for this device
      const changedProperties = Object.entries(editableValues)
        .filter(([_, value]) => value !== undefined)
        .map(([name, value]) => ({
          name,
          value: value
        }));

      if (changedProperties.length === 0) return;

      // Save each changed property
      for (const prop of changedProperties) {
        const response = await fetch('/api/arduino/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId,
            propertyName: prop.name,
            value: prop.value
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
      }

      // Update local state
      setDeviceProperties(prev => ({
        ...prev,
        [deviceId]: prev[deviceId]?.map(prop => 
          editableValues[prop.name] !== undefined
            ? { ...prop, value: editableValues[prop.name] }
            : prop
        ) || []
      }));

      // Clear editable values
      setEditableValues({});
      setEditMode(prev => ({ ...prev, [deviceId]: false }));

    } catch (err) {
      console.error('Failed to save changes:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(prev => ({ ...prev, deviceId: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-rose-300">
        Error: {error}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-4 text-slate-300">
        No devices found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map(device => (
        <div 
          key={device.id}
          className="bg-slate-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div 
            className="p-4 bg-slate-700 flex items-center justify-between cursor-pointer"
            onClick={() => handleDeviceClick(device.id)}
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{device.name}</h3>
              <p className={`text-sm ${device.status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
                {device.status}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {expandedDevice === device.id && (
                <button
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${editMode[device.id]
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editMode[device.id]) {
                      handleSaveChanges(device.id);
                    } else {
                      setEditMode(prev => ({ ...prev, [device.id]: true }));
                    }
                  }}
                  disabled={saving[device.id]}
                >
                  {saving[device.id] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : editMode[device.id] ? (
                    'Save Changes'
                  ) : (
                    'Edit Values'
                  )}
                </button>
              )}
              <button
                className="p-2 hover:bg-slate-600 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeviceSelect(device);
                }}
              >
                <span className="sr-only">View details</span>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {expandedDevice === device.id && (
            <div className="p-4 space-y-6">
              {loadingProperties[device.id] ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : deviceProperties[device.id] ? (
                groupProperties(deviceProperties[device.id]).map(({ group, properties }: GroupedProperties) => (
                  <div key={group} className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{group}</h4>
                    <div className="space-y-3 bg-slate-750 rounded-lg p-3">
                      {properties.map(prop => (
                        <div key={prop.name} className="flex items-center justify-between">
                          <span className="text-slate-300 font-medium">{prop.name}</span>
                          {isEditable(prop.name) && editMode[device.id] ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type={getInputType(prop.name)}
                                step={getStepValue(prop.name)}
                                value={editableValues[prop.name] ?? prop.value}
                                onChange={(e) => handlePropertyChange(device.id, prop.name, e.target.value)}
                                className="bg-slate-700 text-slate-100 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <span className={`${getStatusColor(prop.name, prop.value)} font-medium`}>
                              {formatValue(prop.name, prop.value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-4">
                  No properties found
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 