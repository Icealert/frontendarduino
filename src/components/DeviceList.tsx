'use client';

import { useState } from 'react';
import { ArduinoDevice } from '../types/arduino';

interface DeviceListProps {
  devices: ArduinoDevice[];
  selectedDevice?: ArduinoDevice;
  onDeviceSelect: (device: ArduinoDevice) => void;
}

export default function DeviceList({ devices, selectedDevice, onDeviceSelect }: DeviceListProps) {
  const [error, setError] = useState<string | null>(null);

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
          className={`bg-slate-800 rounded-lg shadow-lg overflow-hidden ${
            selectedDevice?.id === device.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onDeviceSelect(device)}
        >
          <div className="p-4 flex items-center justify-between cursor-pointer">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{device.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`h-2.5 w-2.5 rounded-full ${device.status === 'ONLINE' ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
                <p className={`text-sm ${device.status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
                  {device.status}
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-slate-700 rounded-full transition-colors"
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
      ))}
    </div>
  );
} 