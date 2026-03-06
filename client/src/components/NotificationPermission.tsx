import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../api/axios';

export default function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Show prompt if permission is default and user hasn't dismissed it
      if (Notification.permission === 'default') {
        const dismissed = localStorage.getItem('notification-permission-dismissed');
        if (!dismissed) {
          // Show prompt after 5 seconds
          setTimeout(() => {
            setShowPrompt(true);
          }, 5000);
        }
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
        localStorage.setItem('notification-permission-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrpcPBblQjBITjdmeaWdndBAGqhXWM6EmgBkXnOmHGhGlXe-QZs';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to backend
      await api.post('/notifications/subscribe', {
        subscription: subscription.toJSON()
      });

      // Successfully subscribed to push notifications
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-permission-dismissed', 'true');
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">Enable Notifications</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            Get instant alerts for new ratings, presentations, and important updates!
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={requestPermission}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              Enable Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
