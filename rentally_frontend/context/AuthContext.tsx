/**
 * Auth Context - Global authentication state management
 * Handles login, logout, token management, and user info
 */

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthAPI } from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'broker' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login(username: string, password: string): Promise<void>;
  logout(): void;
  register(data: RegisterData): Promise<void>;
  clearError(): void;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TOKEN'; payload: { accessToken?: string; user?: User } };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,
  refreshToken: null,
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
        refreshToken: action.payload.refreshToken,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return initialState;
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOAD_TOKEN':
      return {
        ...state,
        accessToken: action.payload.accessToken || state.accessToken,
        user: action.payload.user || state.user,
        isAuthenticated: !!(action.payload.accessToken || action.payload.user),
        isLoading: false,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load token from secure storage on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          dispatch({ type: 'LOAD_TOKEN', payload: { accessToken: token } });
        } else {
          dispatch({ type: 'LOAD_TOKEN', payload: {} });
        }
      } catch (error) {
        console.error('Failed to load token:', error);
        dispatch({ type: 'LOAD_TOKEN', payload: {} });
      }
    };
    loadToken();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await AuthAPI.login(username, password);

      if (response.error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        throw new Error(response.error);
      }

      const { access, refresh } = response.data;

      // Save token to secure storage
      await SecureStore.setItemAsync('auth_token', access);
      if (refresh) {
        await SecureStore.setItemAsync('refresh_token', refresh);
      }

      // Fetch user data (you'll need to add this endpoint)
      const mockUser: User = {
        id: 1,
        username,
        email: `${username}@rentally.com`,
        role: 'user',
      };

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: mockUser,
          accessToken: access,
          refreshToken: refresh || '',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // You'll need to implement a registration endpoint
      // const response = await AuthAPI.register(data);
      // For now, just login after registration
      await login(data.username, data.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, [login]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    register,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
