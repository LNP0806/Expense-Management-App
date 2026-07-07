import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Error loading stored auth:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const login = async (data: any) => {
    const res = await authApi.login(data);
    if (res.data.success) {
      const userData = res.data.data.user;
      const jwtToken = res.data.data.accessToken || res.data.data.token;
      const refreshToken = res.data.data.refreshToken;

      setToken(jwtToken || null);
      setUser(userData || null);

      if (jwtToken && typeof jwtToken === 'string') {
        await SecureStore.setItemAsync('token', jwtToken);
      }
      if (userData) {
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
      }
      if (refreshToken && typeof refreshToken === 'string') {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
    }
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    if (res.data.success) {
      const userData = res.data.data.user;
      const jwtToken = res.data.data.accessToken || res.data.data.token;
      const refreshToken = res.data.data.refreshToken;

      setToken(jwtToken || null);
      setUser(userData || null);

      if (jwtToken && typeof jwtToken === 'string') {
        await SecureStore.setItemAsync('token', jwtToken);
      }
      if (userData) {
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
      }
      if (refreshToken && typeof refreshToken === 'string') {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('refreshToken');
    try {
      const { clearDatabase } = require('../database/sqlite');
      const { clearLocalLastSyncedAt } = require('../services/syncService');
      await clearDatabase();
      await clearLocalLastSyncedAt();
    } catch (e) {
      console.error('Failed to clear SQLite DB on logout:', e);
    }
  };

  useEffect(() => {
    if (!token) return;

    const NetInfo = require('@react-native-community/netinfo').default;
    const { syncAll } = require('../services/syncService');

    // Trigger initial sync
    syncAll();

    // Subscribe to network updates
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      if (state.isConnected) {
        console.log('Network online. Triggering syncAll...');
        syncAll();
      }
    });

    return () => unsubscribe();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
