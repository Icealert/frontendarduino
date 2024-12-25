'use client';

import React from 'react';
import { Notification } from '../types/arduino';

interface NotificationAreaProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationArea({ notifications, onDismiss }: NotificationAreaProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-md w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-800'
              : notification.type === 'warning'
              ? 'bg-yellow-50 text-yellow-800'
              : notification.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{notification.message}</p>
              <p className="text-sm mt-1 opacity-75">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-4 text-sm font-medium opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 