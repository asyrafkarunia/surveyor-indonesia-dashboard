import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'marketing' | 'common' | 'approver' | 'head_section' | 'senior_manager' | 'general_manager';
  roleName?: string;
  division?: string;
  avatar?: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isMarketing: () => boolean;
  isApprover: () => boolean;
  isCommon: () => boolean;
  isHeadSection: () => boolean;
  isSeniorManager: () => boolean;
  isGeneralManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        console.log('Loaded user data:', userData);
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Only load user if we have a token
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      console.log('Login response:', response);
      if (response && response.user) {
        // Reset to dashboard on fresh login (best practice)
        localStorage.setItem('activeTab', 'dashboard');
        localStorage.setItem('just_logged_in', 'true');
        console.log('Login success: reset flag set');
        setUser(response.user);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isMarketing = () => user?.role === 'marketing' || user?.role === 'head_section';
  const isApprover = () => ['approver', 'head_section', 'senior_manager', 'general_manager'].includes(user?.role || '');
  const isCommon = () => user?.role === 'common';
  const isHeadSection = () => user?.role === 'head_section';
  const isSeniorManager = () => user?.role === 'senior_manager' || user?.roleName === 'Senior Manager';
  const isGeneralManager = () => user?.role === 'general_manager' || user?.roleName === 'General Manager';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isMarketing, isApprover, isCommon, isHeadSection, isSeniorManager, isGeneralManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};