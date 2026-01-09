import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';

interface NotificationBellProps {
  clinicData: any;
  setCurrentView: (view: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ clinicData, setCurrentView }) => {
  const { notifications } = useNotification();
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(-5).reverse();
  const unreadCount = notifications.length;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationClick = () => {
    setIsDropdownOpen(false);
    // Could navigate to a dedicated notifications page in the future
    // setCurrentView('notifications');
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        aria-label={t('notifications.title') || 'Notifications'}
      >
        {/* Bell Icon */}
        <svg 
          className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('notifications.title') || 'Notifications'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {unreadCount > 0 
                  ? `${unreadCount} ${unreadCount === 1 ? 'new notification' : 'new notifications'}`
                  : 'No new notifications'
                }
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={handleNotificationClick}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-slate-100 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(notification.id.split('.')[0]).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1m6 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
                  </svg>
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
            
            {recentNotifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // In a real implementation, this could clear all notifications
                    // or navigate to a full notifications page
                  }}
                  className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {t('notifications.clearAll') || 'Clear all'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;