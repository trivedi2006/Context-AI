'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserResponse, UserSignup, UserLogin, AuthContextType } from '@/types';
import { authService } from '@/services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check auth session on refresh & handle OAuth URL redirect params
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
          authService.setToken(token);
          // Clean token from URL bar cleanly
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      try {
        const currentUser = await authService.getMe();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (data: UserLogin) => {
    const res = await authService.login(data);
    if (res.token) {
      authService.setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    } else {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    }
  };

  const signup = async (data: UserSignup) => {
    const res = await authService.signup(data);
    if (res.token) {
      authService.setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    } else {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    }
  };

  const googleLogin = async () => {
    const url = authService.getGoogleAuthUrl();
    window.location.href = url;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
