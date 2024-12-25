'use client';

import { ArduinoDevice, ArduinoProperty, formatValue } from '../types/arduino';

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
          <span className={`${device.device_status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
            {device.device_status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Device ID</span>
          <span className="text-slate-400">{device.id}</span>
        </div>

        {device.properties && device.properties.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Properties</h3>
            <div className="space-y-3">
              {device.properties.map((property: ArduinoProperty) => (
                <div key={property.id} className="flex items-center justify-between">
                  <span className="text-slate-300">{property.name}</span>
                  <span className="text-slate-400">
                    {formatValue(property.name, property.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {device.properties?.[0]?.updated_at && (
          <div className="mt-4 text-sm text-slate-400">
            Last updated: {new Date(device.properties[0].updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
} 