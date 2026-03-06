import { useEffect, useState, useRef } from 'react';
import { Bell, X, Star, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  log_id?: string;
  notification_type?: 'procedure' | 'presentation' | 'rated';
}

interface NotificationBellProps {
  show: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

export default function NotificationBell({ show, onClose, onCountChange }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      const unreadCount = response.data.filter((n: Notification) => !n.read).length;
      onCountChange(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleRateNow = async (notification: Notification) => {
    await markAsRead(notification.id);
    onClose();
    
    if (notification.notification_type === 'procedure' || notification.notification_type === 'presentation') {
      navigate('/unresponded-logs');
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'procedure':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: Activity,
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'presentation':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: FileText,
          iconColor: 'text-green-600',
          buttonBg: 'bg-green-600 hover:bg-green-700'
        };
      case 'rated':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-500',
          icon: Star,
          iconColor: 'text-purple-600',
          buttonBg: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          icon: Bell,
          iconColor: 'text-gray-600',
          buttonBg: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  if (!show) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-slideDown"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {notifications.map((notification) => {
              const colorScheme = getNotificationColor(notification.notification_type);
              const Icon = colorScheme.icon;
              const isActionable = notification.notification_type === 'procedure' || notification.notification_type === 'presentation';
              
              return (
                <div
                  key={notification.id}
                  className={`${colorScheme.bg} ${notification.read ? 'opacity-60' : ''} border-l-4 ${colorScheme.border} rounded-lg p-3 transition-all`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`${colorScheme.iconColor} mt-0.5`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 font-medium">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.created_at), 'MMM dd, h:mm a')}
                      </p>
                      
                      {/* Action Buttons */}
                      {!notification.read && (
                        <div className="flex items-center space-x-2 mt-2">
                          {isActionable && (
                            <button
                              onClick={() => handleRateNow(notification)}
                              className={`${colorScheme.buttonBg} text-white px-2 py-1 rounded text-xs font-semibold transition-colors`}
                            >
                              {notification.notification_type === 'procedure' ? 'Rate Procedure' : 'Rate Presentation'}
                            </button>
                          )}
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-600 hover:text-gray-800 text-xs font-semibold"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold w-full text-center"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
