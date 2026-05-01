/**
 * Auth Context - Global authentication state management
 * Handles login, logout, token management, and user info
 */

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { AuthAPI, setLogoutCallback } from '../services/api';
import { storage } from '../services/storage';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'broker' | 'admin';
  is_verified?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  login(username: string, password: string): Promise<void>;
  logout(): void;
  updateUser(userData: Partial<User>): Promise<void>;
  clearError(): void;
}

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TOKEN'; payload: { accessToken: string; user: User } }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'INIT_DONE' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: action.payload.accessToken,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOAD_TOKEN':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'INIT_DONE':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app start
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await storage.getItem('auth_token');
        const userJson = await storage.getItem('auth_user');
        if (token && userJson) {
          const user: User = JSON.parse(userJson);
          dispatch({ type: 'LOAD_TOKEN', payload: { accessToken: token, user } });
        } else {
          dispatch({ type: 'INIT_DONE' });
        }
      } catch {
        dispatch({ type: 'INIT_DONE' });
      }
    };
    restore();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Uses /api/auth/login/ which returns { user, tokens }
      const res: any = await AuthAPI.login(username, password);

      // Handle both /api/auth/login/ (custom) and /api/auth/token/ (JWT) responses
      let accessToken: string;
      let user: User;

      if (res.tokens) {
        // Custom login endpoint response: { user, tokens: { access, refresh } }
        accessToken = res.tokens.access;
        user = res.user;
        await storage.setItem('refresh_token', res.tokens.refresh);
      } else if (res.access) {
        // Simple JWT token endpoint: { access, refresh }
        accessToken = res.access;
        await storage.setItem('refresh_token', res.refresh || '');
        // Build a minimal user object from token
        user = { id: 0, username, email: '', role: 'user' };
      } else {
        throw new Error('Хариу буруу байна');
      }

      await storage.setItem('auth_token', accessToken);
      await storage.setItem('auth_user', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
    } catch (error: any) {
      const message = error.message || 'Нэвтрэхэд алдаа гарлаа';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteItem('auth_token');
    await storage.deleteItem('refresh_token');
    await storage.deleteItem('auth_user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Set logout callback for API service
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    // Update persistent storage
    const currentUserJson = await storage.getItem('auth_user');
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      const updatedUser = { ...currentUser, ...userData };
      await storage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    accessToken: state.accessToken,
    login,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
