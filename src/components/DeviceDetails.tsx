'use client';

import { ArduinoDevice, ArduinoProperty, formatValue, groupProperties } from '../types/arduino';

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

  const propertyGroups = device.properties ? groupProperties(device.properties) : [];

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4">
      {/* Device Header */}
      <div className="border-b border-slate-700 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-100">{device.name}</h2>
        <div className="mt-2 flex items-center space-x-2">
          <div className={`h-2.5 w-2.5 rounded-full ${device.device_status === 'ONLINE' ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
          <span className={`text-sm ${device.device_status === 'ONLINE' ? 'text-teal-300' : 'text-rose-300'}`}>
            {device.device_status}
          </span>
        </div>
      </div>

      {/* Device Properties */}
      {propertyGroups.length > 0 ? (
        <div className="space-y-6">
          {propertyGroups.map(({ group, properties }) => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                {group}
              </h3>
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
        </div>
      ) : (
        <div className="text-slate-400 text-center py-4">
          No properties available
        </div>
      )}

      {/* Device Details */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Device ID</span>
            <span className="text-slate-500 font-mono">{device.id}</span>
          </div>
          {device.connection_type && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection</span>
              <span className="text-slate-500">{device.connection_type}</span>
            </div>
          )}
          {device.properties?.[0]?.updated_at && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Updated</span>
              <span className="text-slate-500">
                {new Date(device.properties[0].updated_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 