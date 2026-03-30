import { useEffect, useState, useRef } from 'react';
import { Bell, X, Star, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { getRatingLabel, getRatingTextColor, canSeeExactScores } from '../utils/ratingUtils';

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
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showExact = canSeeExactScores(user?.role, false);

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
      const unreadNotifications = response.data.filter((n: Notification) => !n.read);
      setNotifications(unreadNotifications);
      onCountChange(unreadNotifications.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      onCountChange(notifications.length - 1);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications([]);
      onCountChange(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      await fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification, autoMarkRead: boolean = false) => {
    // Mark as read first
    if (autoMarkRead) {
      await markAsRead(notification.id);
    }

    // For rated notifications, fetch and show modal
    if (notification.notification_type === 'rated' && notification.log_id) {
      onClose();
      await fetchAndShowRatedItem(notification.log_id);
      return;
    }
    
    // For actionable notifications
    onClose();
    if (notification.notification_type === 'procedure') {
      if (user?.role === 'RESIDENT') {
        navigate('/logs-to-rate');
      } else {
        navigate('/unresponded-logs?tab=procedures');
      }
    } else if (notification.notification_type === 'presentation') {
      if (notification.message?.includes('assigned to present') || notification.message?.includes('cancelled')) {
        navigate('/presentations?tab=assigned');
      } else if (user?.role === 'RESIDENT') {
        navigate('/logs-to-rate');
      } else {
        navigate('/unresponded-logs?tab=presentations');
      }
    }
  };

  const fetchAndShowRatedItem = async (logId: string) => {
    try {
      setLoadingItem(true);
      const isProcedure = logId.includes('-');
      
      if (isProcedure) {
        const response = await api.get('/logs/my-logs?yearId=all');
        const procedure = response.data.find((p: any) => p.id === logId);
        if (procedure) {
          setSelectedLog(procedure);
        } else {
          alert('Could not find the rated procedure.');
        }
      } else {
        const response = await api.get('/presentations/my-presentations');
        const presentation = response.data.find((p: any) => p.id === parseInt(logId));
        if (presentation) {
          setSelectedLog(presentation);
        } else {
          alert('Could not find the rated presentation.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch rated item:', error);
      alert('Failed to load details. Please try again.');
    } finally {
      setLoadingItem(false);
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

  if (!show && !selectedLog && !loadingItem) {
    return null;
  }

  return (
    <>
      {/* Notification Dropdown */}
      {show && (
        <div
          ref={dropdownRef}
          className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-slideDown"
        >
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
                  const isActionable = (notification.notification_type === 'procedure' || notification.notification_type === 'presentation') && !notification.message?.includes('cancelled');
                  const isRated = notification.notification_type === 'rated';
                  const isClickable = isActionable || isRated;
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => isClickable && handleNotificationClick(notification, true)}
                      className={`${colorScheme.bg} border-l-4 ${colorScheme.border} rounded-lg p-3 transition-all ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
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
                          
                          <div className="flex items-center space-x-2 mt-2">
                            {isActionable && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification, true);
                                }}
                                className={`${colorScheme.buttonBg} text-white px-2 py-1 rounded text-xs font-semibold transition-colors`}
                              >
                                {notification.notification_type === 'procedure' ? 'Rate Procedure' 
                                  : notification.message?.includes('assigned to present') ? 'View Assignment'
                                  : notification.message?.includes('ready for rating') ? 'Rate Presentation'
                                  : 'View'}
                              </button>
                            )}
                            {isRated && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification, true);
                                }}
                                className={`${colorScheme.buttonBg} text-white px-2 py-1 rounded text-xs font-semibold transition-colors`}
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
            )}
          </div>

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
      )}

      {/* Loading Overlay */}
      {loadingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Detail Modal - EXACT COPY from RatedLogs.tsx */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="text-lg sm:text-xl font-bold">
                {selectedLog.procedure ? 'Procedure Details' : 'Presentation Details'}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="hover:bg-blue-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {selectedLog.procedure ? (
                // Procedure Details
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Date</label>
                      <p className="text-gray-900">{format(new Date(selectedLog.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">MRN</label>
                      <p className="text-gray-900">{selectedLog.mrn}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Age</label>
                      <p className="text-gray-900">{selectedLog.age}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Sex</label>
                      <p className="text-gray-900">{selectedLog.sex}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Diagnosis</label>
                    <p className="text-gray-900">{selectedLog.diagnosis}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Procedure</label>
                    <p className="text-gray-900 font-medium">{selectedLog.procedure}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Type</label>
                      <p className="text-gray-900">{selectedLog.procedure_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Institution</label>
                      <p className="text-gray-900">{selectedLog.place_of_practice}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Role</label>
                      <p className="text-gray-900">{selectedLog.surgery_role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  {selectedLog.supervisor_name && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Supervisor</label>
                      <p className="text-gray-900">{selectedLog.supervisor_name}</p>
                    </div>
                  )}
                  {selectedLog.rating && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Rating</label>
                        <p className={'text-2xl font-bold ' + getRatingTextColor(selectedLog.rating)}>
                          {showExact ? selectedLog.rating + '/100' : getRatingLabel(selectedLog.rating)}
                        </p>
                      </div>
                      {selectedLog.comment && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">Comment</label>
                          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedLog.comment}</p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedLog.postop_followup_comment && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-semibold text-purple-700">Supervisor Post-Op Follow-Up</label>
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg mt-1">
                        <p className="text-gray-800">{selectedLog.postop_followup_comment}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedLog.supervisor_name} · {new Date(selectedLog.postop_followup_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Presentation Details
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Date</label>
                      <p className="text-gray-900">{format(new Date(selectedLog.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Type</label>
                      <p className="text-gray-900">{selectedLog.presentation_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Title</label>
                    <p className="text-gray-900 font-medium">{selectedLog.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Venue</label>
                    <p className="text-gray-900">
                      {selectedLog.venue === 'Assigned' ? 'Y12HMC' : selectedLog.venue}
                      {selectedLog.venue === 'Assigned' && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Assigned Presentation</span>
                      )}
                    </p>
                  </div>
                  {selectedLog.description && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Description</label>
                      <p className="text-gray-900">{selectedLog.description}</p>
                    </div>
                  )}
                  {selectedLog.supervisor_name && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Supervisor</label>
                      <p className="text-gray-900">{selectedLog.supervisor_name}</p>
                    </div>
                  )}
                  {selectedLog.rating && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Rating</label>
                        <p className={'text-2xl font-bold ' + getRatingTextColor(selectedLog.rating)}>
                          {showExact ? selectedLog.rating + '/100' : getRatingLabel(selectedLog.rating)}
                        </p>
                      </div>
                      {selectedLog.comment && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">Comment</label>
                          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedLog.comment}</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
