import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Load persisted session on startup ──────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem('unikit_token'),
          AsyncStorage.getItem('unikit_user'),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.warn('Session load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const data = res.data;

    if (data.firstLogin) {
      // Return signal for first-login flow
      return { firstLogin: true, userId: data.userId, name: data.name };
    }

    await persistSession(data.token, data.user);
    return { firstLogin: false };
  };

  // ─── Set password (first login) ──────────────────────────────────────────────
  const setFirstPassword = async (userId, password) => {
    const res = await authService.setPassword(userId, password);
    await persistSession(res.data.token, res.data.user);
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    await AsyncStorage.multiRemove(['unikit_token', 'unikit_user']);
    setToken(null);
    setUser(null);
  };

  // ─── Refresh user from server ────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      const updated = res.data.user;
      setUser(updated);
      await AsyncStorage.setItem('unikit_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Refresh user error:', e);
    }
  };

  const persistSession = async (tkn, usr) => {
    await AsyncStorage.setItem('unikit_token', tkn);
    await AsyncStorage.setItem('unikit_user', JSON.stringify(usr));
    setToken(tkn);
    setUser(usr);
  };

  const isHOD = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const canManage = isHOD || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user, token, loading,
        login, logout, setFirstPassword, refreshUser,
        isHOD, isAdmin, isTeacher, isStudent, canManage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
