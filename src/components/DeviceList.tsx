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

  const handlePropertyChange = async (deviceId: string, propertyName: string, value: any) => {
    try {
      setSaving(prev => ({ ...prev, [propertyName]: true }));
      
      const response = await fetch('/api/arduino/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          propertyName,
          value
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.id === deviceId) {
            return {
              ...device,
              properties: device.properties?.map(prop => 
                prop.name === propertyName ? { ...prop, value } : prop
              )
            };
          }
          return device;
        })
      );

      setEditableValues(prev => ({ ...prev, [propertyName]: undefined }));
    } catch (err) {
      console.error('Failed to save value:', err);
      // Show error in UI
    } finally {
      setSaving(prev => ({ ...prev, [propertyName]: false }));
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
            onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{device.name}</h3>
              <p className={`text-sm ${device.status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
                {device.status}
              </p>
            </div>
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

          {expandedDevice === device.id && device.properties && (
            <div className="p-4 space-y-6">
              {groupProperties(device.properties).map(({ group, properties }: GroupedProperties) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-400 uppercase">{group}</h4>
                  <div className="space-y-1">
                    {properties.map(prop => (
                      <div key={prop.name} className="flex items-center justify-between">
                        <span className="text-slate-300">{prop.name}</span>
                        {isEditable(prop.name) ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type={getInputType(prop.name)}
                              step={getStepValue(prop.name)}
                              value={editableValues[prop.name] ?? prop.value}
                              onChange={(e) => setEditableValues(prev => ({
                                ...prev,
                                [prop.name]: e.target.value
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handlePropertyChange(device.id, prop.name, editableValues[prop.name]);
                                }
                              }}
                              className="bg-slate-700 text-slate-100 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {saving[prop.name] && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            )}
                          </div>
                        ) : (
                          <span className={getStatusColor(prop.name, prop.value)}>
                            {formatValue(prop.name, prop.value)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 