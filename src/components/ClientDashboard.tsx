'use client';

import { useState, useEffect } from 'react';
import { ArduinoDevice } from '@/types/arduino';
import DeviceList from '@/components/DeviceList';
import { createArduinoApiClient, ArduinoApiClient } from '@/api/arduinoApi';

export default function ClientDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ArduinoApiClient | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<ArduinoDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeArduino() {
      try {
      
        const arduinoClient = await createArduinoApiClient();
        setClient(arduinoClient);
        setIsConnected(true);
        setError(null);
      } catch (err: any) {
        console.error('Failed to initialize Arduino client:', err);
        setError(err.message || 'Failed to connect to Arduino IoT Cloud');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }

    initializeArduino();
  }, []);

  const handleDeviceSelect = (device: ArduinoDevice) => {
    setSelectedDevice(device);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          Arduino IoT Cloud Dashboard
        </h1>
        <p className="text-blue-700">
          Monitor and control your Arduino IoT Cloud devices
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-rose-900 mb-2">Connection Error</h2>
          <p className="text-rose-800">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Device List
                </h2>
              </div>
              <div className="p-6">
                {client && (
                  <DeviceList 
                    client={client}
                    onDeviceSelect={handleDeviceSelect}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Connection Status
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
                  <span className={`font-medium ${isConnected ? 'text-teal-700' : 'text-rose-700'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Client ID:</span>
                    {/* Optional: remove or replace with server-based data if needed */}
                    <span className="text-rose-600">Hidden (server-only)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Secret:</span>
                   {/* Optional: remove or replace with server-based data if needed */}
                    <span className="text-rose-600">Hidden (server-only)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 