'use client';

import { ArduinoDevice } from '../types/arduino';

interface DeviceDetailsProps {
  device: ArduinoDevice | null;
}

export default function DeviceDetails({ device }: DeviceDetailsProps) {
  if (!device) {
    return (
      <div className="p-4 text-slate-300">
        Select a device to view details
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">{device.name}</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Status</span>
          <span className={`${device.status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
            {device.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Device ID</span>
          <span className="text-slate-400">{device.id}</span>
        </div>
      </div>
    </div>
  );
} 