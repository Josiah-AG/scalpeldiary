import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  log_id?: string;
}

export default function NotificationPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchUnreadNotifications();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n: Notification) => !n.read);
      
      if (unread.length > 0) {
        setNotifications(unread);
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Close popup if no more notifications
      if (notifications.length === 1) {
        setShowPopup(false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications([]);
      setShowPopup(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!showPopup || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">New Notifications</h3>
              <p className="text-blue-100 text-xs">
                {notifications.length} unread {notifications.length === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
          </div>
          <button
            onClick={closePopup}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 hover:bg-blue-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <p className="text-sm text-gray-800 font-medium">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notification.created_at), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold whitespace-nowrap"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            Mark all as read
          </button>
          <button
            onClick={closePopup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
