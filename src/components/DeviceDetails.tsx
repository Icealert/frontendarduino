'use client';

import React, { useEffect, useState } from 'react';
import { ArduinoDevice, ArduinoProperty } from '../types/arduino';
import type { ArduinoApiClient } from '../api/arduinoApi';

interface DeviceDetailsProps {
  device: ArduinoDevice;
  client: ArduinoApiClient;
}

export function DeviceDetails({ device, client }: DeviceDetailsProps) {
  const [properties, setProperties] = useState<ArduinoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'online' | 'offline'>(device.status);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const fetchedProperties = await client.getDeviceProperties(device.id);
        setProperties(fetchedProperties);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch device properties');
      } finally {
        setLoading(false);
      }
    }

    async function checkStatus() {
      const currentStatus = await client.getDeviceStatus(device.id);
      setStatus(currentStatus);
    }

    fetchProperties();
    checkStatus();

    // Refresh properties every 10 seconds
    const propertiesInterval = setInterval(fetchProperties, 10000);
    // Check status every 30 seconds
    const statusInterval = setInterval(checkStatus, 30000);

    return () => {
      clearInterval(propertiesInterval);
      clearInterval(statusInterval);
    };
  }, [client, device.id]);

  const formatValue = (property: ArduinoProperty) => {
    if (property.value === null || property.value === undefined) {
      return 'N/A';
    }

    if (typeof property.value === 'number') {
      return property.value.toFixed(2);
    }

    if (typeof property.value === 'boolean') {
      return property.value ? 'On' : 'Off';
    }

    return property.value.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-500">
          <p>Error loading device properties:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{device.name}</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'online'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Properties</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">{property.name}</h4>
                  {property.unit && (
                    <span className="text-sm text-gray-500">{property.unit}</span>
                  )}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(property)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated:{' '}
                  {property.timestamp
                    ? new Date(property.timestamp).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {properties.length === 0 && (
          <div className="text-center text-gray-500">
            No properties available for this device
          </div>
        )}
      </div>
    </div>
  );
} 