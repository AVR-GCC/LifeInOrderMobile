import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { HabitWithValues } from '../types';

const RT_KEY = 'refresh_token';
const baseUrl = process.env.EXPO_PUBLIC_API_BASE;

type Status = 'loading' | 'authenticated' | 'unauthenticated' | 'offline';

type AuthData = {
  accessToken: string,
  userId: number,
  habits: HabitWithValues[]
} | null;

type AuthState = {
  status: Status;
  authData: AuthData;
  signUp: (email: string, password: string) => Promise<void>;
  confirmEmail: (email: string, otp: number) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};

type ReturnData = {
  tokens: {
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token: string
  },
  user: {
    sub: number,
    exp: number,
    iss: string
  },
  habits: HabitWithValues[]
}

const AuthContext = createContext<AuthState | null>(null);

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.log('useSession must be used inside <AuthProvider>');
    throw new Error('useSession must be used inside <AuthProvider>');
  }
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<Status>('loading');
  const [authData, setAuthData] = useState<AuthData>(null);

  async function callRefresh(rt: string) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${baseUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
        signal: ctrl.signal,
      });
      if (res.status === 401) return { kind: 'rejected' as const };
      if (!res.ok) return { kind: 'network' as const };
      const data: ReturnData = await res.json();
      return { kind: 'ok' as const, data };
    } catch (e) {
      console.log('e', e);
      return { kind: 'network' as const };
    } finally {
      clearTimeout(timer);
    }
  }

  const updateAuthData = async (data: ReturnData) => {
    const { refresh_token, access_token } = data.tokens;
    await SecureStore.setItemAsync(RT_KEY, refresh_token);
    const newAuthData = { accessToken: access_token, userId: data.user.sub, habits: data.habits };
    setAuthData(newAuthData);
    setStatus('authenticated');
  }

  async function bootstrap() {
    const rt = await SecureStore.getItemAsync(RT_KEY);
    if (!rt) return setStatus('unauthenticated');

    const result = await callRefresh(rt);
    if (result.kind === 'ok') {
      const data: ReturnData = result.data;
      await SecureStore.setItemAsync(RT_KEY, data.tokens.refresh_token);
      updateAuthData(data);
    } else if (result.kind === 'rejected') {
      await SecureStore.deleteItemAsync(RT_KEY);
      setStatus('unauthenticated');
    } else {
      setStatus('offline');
    }
  }

  useEffect(() => {
    setTimeout(bootstrap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmEmail(email: string, otp: number) {
    const body = { email, otp };
    console.log('body', body);
    const res = await fetch(`${baseUrl}/confirm_email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.log('Email confirmation failed', res);
      throw new Error('Email confirmation failed');
    }
    const data = await res.json();
    updateAuthData(data);
  }

  async function signUp(email: string, password: string) {
    const res = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'placeholder' }),
    });
    if (!res.ok) {
      console.log('Signup failed', res);
      throw new Error('Signup failed');
    }
  }

  async function signIn(email: string, password: string) {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      console.log('Invalid credentials', res);
      throw new Error('Invalid credentials');
    }
    const data = await res.json();
    updateAuthData(data);
  }

  async function signOut() {
    const rt = await SecureStore.getItemAsync(RT_KEY);
    if (rt) {
      fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      }).catch(() => {}); // best-effort; local state clears regardless
    }
    await SecureStore.deleteItemAsync(RT_KEY);
    setStatus('unauthenticated');
    setAuthData(null);
  }

  function retry() {
    setStatus('loading');
    bootstrap();
  }

  return (
    <AuthContext.Provider value={{ status, authData, signUp, confirmEmail, signIn, signOut, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
