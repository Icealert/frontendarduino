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
  devices: ArduinoDevice[];
  onDeviceSelect: (device: ArduinoDevice) => void;
  selectedDevice?: ArduinoDevice;
}

export default function DeviceList({ devices, onDeviceSelect, selectedDevice }: DeviceListProps) {
  // Function to get status color
  const getStatusColor = (status: 'ONLINE' | 'OFFLINE') => {
    return status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500';
  };

  // Function to get status text style
  const getStatusTextStyle = (status: 'ONLINE' | 'OFFLINE') => {
    return status === 'ONLINE' ? 'text-green-700' : 'text-red-700';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Devices</h2>
        <p className="mt-1 text-sm text-gray-500">
          {devices.length} device{devices.length !== 1 ? 's' : ''} found
        </p>
      </div>
      <ul className="divide-y divide-gray-200">
        {devices.map((device) => (
          <li
            key={device.id}
            className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out ${
              selectedDevice?.id === device.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onDeviceSelect(device)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Status Indicator */}
                  <div className="relative">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(device.status)} animate-pulse`}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {device.name || 'Unnamed Device'}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span
                        className={`text-xs font-medium ${getStatusTextStyle(device.status)} bg-opacity-10 px-2 py-0.5 rounded-full`}
                      >
                        {device.status}
                      </span>
                      {device.thing && (
                        <span className="ml-2 text-xs text-gray-500">
                          {device.thing.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last Activity */}
                {device.last_activity_at && (
                  <div className="text-right text-xs text-gray-500">
                    Last active:{' '}
                    {new Date(device.last_activity_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Device Details */}
              <div className="mt-2 text-sm text-gray-500 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Type:</span>{' '}
                  {device.type || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">ID:</span>{' '}
                  {device.id.slice(0, 8)}...
                </div>
                {device.fqbn && (
                  <div className="col-span-2">
                    <span className="font-medium">FQBN:</span> {device.fqbn}
                  </div>
                )}
              </div>

              {/* Properties Summary */}
              {device.thing?.properties && (
                <div className="mt-2 text-sm">
                  <div className="font-medium text-gray-700">Properties:</div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {device.thing.properties.map((prop) => (
                      <div
                        key={prop.id}
                        className="text-gray-500 flex items-center justify-between"
                      >
                        <span>{prop.name}:</span>
                        <span className="font-mono">
                          {prop.last_value !== undefined
                            ? String(prop.last_value)
                            : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 