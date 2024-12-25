'use client';

import { useState, useEffect } from 'react';
import DeviceList from '@/components/DeviceList';

export default function Home() {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/test');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to connect to Arduino IoT Cloud');
        }

        setStatus(data.message || 'Successfully connected!');
        setIsAuthenticated(true);
        setError(null);
      } catch (err: any) {
        console.error('Connection error:', err);
        setStatus('Connection failed');
        setError(err.message);
        setIsAuthenticated(false);
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800">
      {/* Header */}
      <header className="bg-indigo-900/30 backdrop-blur-lg border-b border-indigo-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Logo/Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-lg border border-indigo-500/20 group hover:from-indigo-500/20 hover:to-indigo-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-indigo-100 tracking-tight">IceAlert Dashboard</h1>
                <p className="text-indigo-300/90">Real-time Temperature Monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors duration-300 ${
                status.includes('Success') 
                  ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30 ring-1 ring-teal-400/20' 
                  : 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 ring-1 ring-indigo-400/20'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  status.includes('Success') ? 'bg-teal-400' : 'bg-indigo-400'
                }`} />
                {status}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Status Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-indigo-500/20">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-indigo-100 tracking-tight mb-4">System Status</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-indigo-200 mb-1">Connection</div>
                    <div className={`text-sm ${status.includes('Success') ? 'text-teal-300' : 'text-indigo-300'}`}>
                      {status}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-indigo-200 mb-2">Environment</div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <span className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center backdrop-blur-sm shadow-lg ring-1 ${
                          process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID 
                            ? 'bg-teal-500/20 text-teal-200 ring-teal-400/30' 
                            : 'bg-rose-500/20 text-rose-200 ring-rose-400/30'
                        }`}>
                          {process.env.NEXT_PUBLIC_ARDUINO_CLIENT_ID ? '✓' : '✗'}
                        </span>
                        <span className="text-indigo-200">Client ID</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center backdrop-blur-sm shadow-lg ring-1 ${
                          process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET 
                            ? 'bg-teal-500/20 text-teal-200 ring-teal-400/30' 
                            : 'bg-rose-500/20 text-rose-200 ring-rose-400/30'
                        }`}>
                          {process.env.NEXT_PUBLIC_ARDUINO_CLIENT_SECRET ? '✓' : '✗'}
                        </span>
                        <span className="text-indigo-200">Client Secret</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-indigo-500/20">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-indigo-100 tracking-tight mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 rounded-lg text-sm font-medium transition-colors duration-300 border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/10 ring-1 ring-indigo-400/20"
                  >
                    Refresh Connection
                  </button>
                  <a 
                    href="https://create.arduino.cc/iot/things"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-100 rounded-lg text-sm font-medium text-center transition-colors duration-300 border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/10 ring-1 ring-indigo-400/20"
                  >
                    Open Arduino IoT Cloud
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error ? (
              <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-indigo-500/20">
                <div className="p-6">
                  <div className="flex items-center space-x-3 text-rose-300 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold">Connection Error</h2>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                    <p className="text-rose-200">{error}</p>
                  </div>
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-indigo-500/20">
                <div className="border-b border-indigo-500/20 p-6">
                  <h2 className="text-lg font-semibold text-indigo-100 tracking-tight">Your Devices</h2>
                  <p className="mt-1 text-sm text-indigo-300/90">
                    Monitor your IceAlert sensors in real-time
                  </p>
                </div>
                <div className="p-6">
                  <DeviceList />
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-indigo-500/20">
                <div className="p-6">
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-300 border-t-transparent" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 