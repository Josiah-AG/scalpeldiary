import { useEffect, useState } from 'react';
import { X, Bell, Star, FileText, Activity } from 'lucide-react';
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

export default function NotificationPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if popup has already been shown in this session
    const popupShown = sessionStorage.getItem('notificationPopupShown');
    
    if (!popupShown) {
      fetchUnreadNotifications();
    }
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n: Notification) => !n.read);
      
      if (unread.length > 0) {
        setNotifications(unread);
        setShowPopup(true);
        // Mark that popup has been shown in this session
        sessionStorage.setItem('notificationPopupShown', 'true');
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

  const handleRateNow = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification.id);
    
    // Navigate to appropriate page with correct tab
    if (notification.notification_type === 'procedure') {
      navigate('/unresponded-logs?tab=procedures');
    } else if (notification.notification_type === 'presentation') {
      navigate('/unresponded-logs?tab=presentations&autoOpen=true');
    } else if (notification.notification_type === 'rated') {
      // Navigate to appropriate page to view rated item
      if (notification.log_id) {
        // It's a procedure - go to ratings done page (procedures tab)
        navigate('/ratings-done?tab=procedures');
      } else {
        // It's a presentation - go to ratings done page (presentations tab)
        navigate('/ratings-done?tab=presentations');
      }
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
          {notifications.map((notification) => {
            const colorScheme = getNotificationColor(notification.notification_type);
            const Icon = colorScheme.icon;
            const isActionable = notification.notification_type === 'procedure' || notification.notification_type === 'presentation';
            const isRated = notification.notification_type === 'rated';
            const isClickable = isActionable || isRated;
            
            return (
              <div
                key={notification.id}
                onClick={() => isClickable && handleRateNow(notification)}
                className={`${colorScheme.bg} border-l-4 ${colorScheme.border} rounded-lg p-4 hover:shadow-md transition-all ${isClickable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${colorScheme.iconColor} mt-1`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notification.created_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-3">
                      {isActionable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateNow(notification);
                          }}
                          className={`${colorScheme.buttonBg} text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors`}
                        >
                          {notification.notification_type === 'procedure' ? 'Rate Procedure' : 'Rate Presentation'}
                        </button>
                      )}
                      {isRated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateNow(notification);
                          }}
                          className={`${colorScheme.buttonBg} text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors`}
                        >
                          View Details
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
