'use client';

import React, { useState, useEffect } from 'react';
import { createArduinoApiClient } from '../api/arduinoApi';
import { DeviceList } from './DeviceList';
import { DeviceDetails } from './DeviceDetails';
import { NotificationArea } from './NotificationArea';
import { ArduinoDevice, Notification } from '../types/arduino';

export default function Dashboard() {
  const [client, setClient] = useState<ReturnType<typeof createArduinoApiClient> | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<ArduinoDevice | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET;

    console.log('Environment variables:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length
    });

    try {
      if (clientId && clientSecret) {
        const apiClient = createArduinoApiClient(clientId, clientSecret);
        console.log('Created API client successfully');
        setClient(apiClient);
        setError(null);
      } else {
        setError('Missing API credentials. Please check your .env.local file.');
      }
    } catch (err: any) {
      console.error('Error creating API client:', err);
      setError(err.message || 'Failed to initialize Arduino IoT Cloud client');
    }
  }, []);

  const handleDeviceSelect = (device: ArduinoDevice) => {
    setSelectedDevice(device);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Arduino IoT Dashboard
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p className="mb-2">Debug Information:</p>
            <pre className="bg-gray-100 p-2 rounded text-left overflow-auto">
              {JSON.stringify({
                clientId: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID?.slice(0, 5) + '...',
                clientSecret: process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET ? '✓' : '✗',
                deviceIds: [
                  process.env.NEXT_PUBLIC_ARDUINO_DEVICE_ID_1?.slice(0, 5) + '...',
                  process.env.NEXT_PUBLIC_ARDUINO_DEVICE_ID_2?.slice(0, 5) + '...'
                ]
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Arduino IoT Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Initializing... Please wait.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Arduino IoT Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Connected Devices
            </h2>
            <DeviceList client={client} onDeviceSelect={handleDeviceSelect} />
          </div>

          <div className="lg:col-span-8">
            {selectedDevice ? (
              <DeviceDetails device={selectedDevice} client={client} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <p className="text-gray-600">
                  Select a device to view its details
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <NotificationArea
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
} 