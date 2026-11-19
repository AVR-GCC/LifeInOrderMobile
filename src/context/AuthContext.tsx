import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { HabitWithValues } from '../types';
import { tryCatchBlock } from '../utils/general';
import SocketClient from '../api/client';
import Toast from 'react-native-toast-message';

const RT_KEY = 'refresh_token';
const baseUrl = process.env.EXPO_PUBLIC_API_BASE;

type User = {
  id: number,
  email: string,
  created_at: string
};

type Claims = {
  exp: number,
  iss: string,
  sub: string,
  user: User
}

type AuthData = {
  accessToken: string,
  user: User,
  habits: HabitWithValues[]
} | null;

type ClientWithStatus = {
  status: 'authenticated';
  client: SocketClient;
} | {
  status: 'loading' | 'unauthenticated' | 'offline';
}

type AuthState = {
  clientWithStatus: ClientWithStatus;
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
  claims: Claims,
  habits: HabitWithValues[]
}

type Response = {
  kind: string,
  data?: ReturnData
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
  const [clientWithStatus, setClientWithStatus] = useState<ClientWithStatus>({ status: 'loading' });
  const [authData, setAuthData] = useState<AuthData>(null);
  const stepRef = useRef('start');

  const callRefresh: (rt: string) => Promise<Response> = async(rt) => {
    const ctrl = new AbortController();
    const url = `${baseUrl}/refresh`;
    const body = JSON.stringify({ refresh_token: rt });
    const cfg = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: ctrl.signal,
    };
    const tryFunc = async() => {
      const res = await fetch(url, cfg);
      if (res.status === 401) return { kind: 'rejected' as const };
      if (!res.ok) return { kind: 'network' as const };
      const data: ReturnData = await res.json();
      return { kind: 'ok' as const, data };
    }
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await tryCatchBlock<Response>(tryFunc, 'Authntication failed');
    clearTimeout(timer);
    return res || { kind: 'network' as const } as Response;
  }

  const connectSocket = async (token: string) => {
    const client = new SocketClient(() => bootstrap(false));
    await client.connect(token);
    setClientWithStatus({
      status: 'authenticated',
      client
    });
  }

  const updateAuthData = async (data: ReturnData) => {
    const { refresh_token, access_token } = data.tokens;
    await SecureStore.setItemAsync(RT_KEY, refresh_token);
    const newAuthData = { accessToken: access_token, user: data.claims.user, habits: data.habits };
    setAuthData(newAuthData);
  }

  async function bootstrap(newSocket = true) {
    try {
      stepRef.current = 'reading token';
      const rt = await SecureStore.getItemAsync(RT_KEY);
      console.log('[boot] token present:', !!rt);
      if (!rt) {
        setClientWithStatus({ status: 'unauthenticated' });
        return "";
      }

      stepRef.current = 'calling refresh';
      const result = await callRefresh(rt);
      console.log('[boot] refresh result:', result.kind);

      if (result.kind === 'ok' && result.data) {
        stepRef.current = 'saving auth data';
        await updateAuthData(result.data);
        if (newSocket) {
          stepRef.current = 'connecting socket';
          await connectSocket(result.data.tokens.access_token);
        }
        return result.data.tokens.access_token;
      }
      if (result.kind === 'rejected') {
        await SecureStore.deleteItemAsync(RT_KEY);
        setClientWithStatus({ status: 'unauthenticated' });
      } else {
        setClientWithStatus({ status: 'offline' });
      }
    } catch (e: any) {
      console.log('[boot] failed at', stepRef.current, e);
      Toast.show({ type: 'error', text1: `Boot failed: ${stepRef.current}`, text2: String(e?.message ?? e), visibilityTime: 15000 });
      setClientWithStatus({ status: 'offline' });
    } finally {
      stepRef.current = 'done';
    }
    return "";
  }

  useEffect(() => {
    setTimeout(bootstrap);
    const watchdog = setTimeout(() => {
      if (stepRef.current === 'done') return;
      Toast.show({ type: 'error', text1: 'Startup stalled', text2: stepRef.current, visibilityTime: 15000 });
      setClientWithStatus(prev => (prev.status === 'loading' ? { status: 'offline' } : prev));
    }, 10000);
    return () => clearTimeout(watchdog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmEmail(email: string, otp: number) {
    const body = { email, otp };
    const res = await fetch(`${baseUrl}/confirm_email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.log('Email confirmation failed', res);
      const text2 = res.statusText;
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2,
        position: 'top',
        visibilityTime: 4000,
      });
    }
    const data = await res.json();
    await updateAuthData(data);
    await connectSocket(data.tokens.access_token);
  }

  async function signUp(email: string, password: string) {
    const res = await fetch(`${baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'placeholder' }),
    });
    if (!res.ok) {
      console.log('Signup failed', res);
      const text2 = res.statusText;
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2,
        position: 'top',
        visibilityTime: 4000,
      });
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
      Toast.show({
        type: 'error',
        text1: 'Incorrect email or password',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }
    const data = await res.json();
    await updateAuthData(data);
    await connectSocket(data.tokens.access_token);
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
    setClientWithStatus({ status: 'unauthenticated' });
    setAuthData(null);
  }

  function retry() {
    setClientWithStatus({ status: 'offline' });
    bootstrap();
  }

  return (
    <AuthContext.Provider
      value={{
        clientWithStatus,
        authData,
        signUp,
        confirmEmail,
        signIn,
        signOut,
        retry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
