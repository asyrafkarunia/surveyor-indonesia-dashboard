import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  decrementUnreadCount: (amount?: number) => void;
  resetUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.getNotificationCount();
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, [user]);

  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 15 seconds for near real-time updates
      const interval = setInterval(fetchUnreadCount, 15000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, decrementUnreadCount, resetUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};