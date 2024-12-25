'use client';

import { useState, useEffect } from 'react';
import DeviceList from '@/components/DeviceList';
import { ArduinoDevice } from '@/types/arduino';

export default function Home() {
  const [devices, setDevices] = useState<ArduinoDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<ArduinoDevice | undefined>();

  useEffect(() => {
    fetchDevices();
    // Refresh devices every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arduino');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setDevices(data.devices || []);
        // Update selected device if it exists in the new data
        if (selectedDevice) {
          const updatedDevice = data.devices?.find(
            (d: ArduinoDevice) => d.id === selectedDevice.id
          );
          setSelectedDevice(updatedDevice);
        }
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device: ArduinoDevice) => {
    setSelectedDevice(device);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Arduino IoT Cloud Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              )}
              <button
                onClick={fetchDevices}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Devices
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          ) : devices.length === 0 && !loading ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No devices found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect a device to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <DeviceList
                devices={devices}
                onDeviceSelect={handleDeviceSelect}
                selectedDevice={selectedDevice}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 