'use client';

import { useState } from 'react';
import { ArduinoDevice, ArduinoProperty, formatValue, groupProperties } from '../types/arduino';

interface DeviceListProps {
  devices: ArduinoDevice[];
  selectedDevice?: ArduinoDevice;
  onDeviceSelect: (device: ArduinoDevice) => void;
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
      <div className="p-4 text-slate-300">
        No devices found
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
    <div className="space-y-4">
      {devices.map(device => (
        <div 
          key={device.id}
          className={`bg-slate-800 rounded-lg shadow-lg overflow-hidden ${
            selectedDevice?.id === device.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => handleDeviceClick(device)}
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{device.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`h-2.5 w-2.5 rounded-full ${device.device_status === 'ONLINE' ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
                <p className={`text-sm ${device.device_status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
                  {device.device_status}
                </p>
              </div>
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
                      {properties.map((property: ArduinoProperty) => (
                        <div key={property.id} className="flex items-center justify-between">
                          <span className="text-slate-300">{property.name}</span>
                          <span className="text-slate-400">
                            {formatValue(property.name as any, property.value)}
                          </span>
                        </div>
                      ))}
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
                    {device.properties?.[0]?.updated_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Last Updated</span>
                        <span className="text-slate-400">
                          {new Date(device.properties[0].updated_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 