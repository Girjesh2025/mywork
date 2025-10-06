import React, { useState, useEffect } from 'react';

export function Notification({ message, type, isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        shadow-lg max-w-sm min-w-[300px]
        ${getTypeStyles()}
      `}>
        <span className="text-lg">{getIcon()}</span>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="text-white/60 hover:text-white/80 transition-colors ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useNotification() {
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({
      message,
      type,
      isVisible: true,
      duration
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const NotificationComponent = () => (
    <Notification
      message={notification.message}
      type={notification.type}
      isVisible={notification.isVisible}
      onClose={hideNotification}
      duration={notification.duration}
    />
  );

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
}