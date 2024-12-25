'use client';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface NotificationAreaProps {
  notifications: Notification[];
}

export default function NotificationArea({ notifications }: NotificationAreaProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-4 text-slate-300">
        No notifications
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-teal-800/50 text-teal-100' :
            notification.type === 'error' ? 'bg-rose-800/50 text-rose-100' :
            notification.type === 'warning' ? 'bg-amber-800/50 text-amber-100' :
            'bg-slate-800/50 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <p>{notification.message}</p>
            <span className="text-sm opacity-75">
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 