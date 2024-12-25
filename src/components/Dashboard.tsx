'use client';

import { useState, useEffect } from 'react';
import { ArduinoDevice } from '../types/arduino';
import DeviceList from './DeviceList';
import DeviceDetails from './DeviceDetails';
import NotificationArea from './NotificationArea';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export default function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState<ArduinoDevice | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Initialize client
    const initClient = async () => {
      try {
        const response = await fetch('/api/arduino');
        const data = await response.json();
        
        if (data.error) {
          addNotification('error', data.error);
        } else {
          setClient(data.client);
          addNotification('success', 'Successfully connected to Arduino IoT Cloud');
        }
      } catch (err) {
        addNotification('error', 'Failed to connect to Arduino IoT Cloud');
      }
    };

    initClient();
  }, []);

  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev].slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Arduino IoT Cloud Dashboard</h1>
          <p className="text-slate-300">Monitor and control your Arduino IoT Cloud devices</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DeviceList
              client={client}
              onDeviceSelect={setSelectedDevice}
            />
            {selectedDevice && (
              <DeviceDetails device={selectedDevice} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Notifications</h2>
            <NotificationArea notifications={notifications} />
          </div>
        </div>
      </div>
    </div>
  );
} 