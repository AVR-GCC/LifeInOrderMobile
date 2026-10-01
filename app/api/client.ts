import * as Crypto from 'expo-crypto';

import type { Habit, SetValueSocket, DeleteHabitSocket, UpdateHabitSocket, ReorderHabitsSocket, Option, DeleteOptionSocket, UpdateOptionSocket, ReorderOptionsSocket, CreateOptionSocket, CreateHabitSocket, Segment } from '../types';
import { debounce } from '../utils/API';
import { AppState, NativeEventSubscription } from 'react-native';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE;
const wsUrl = (baseUrl || '').replace(/^http/, 'ws') + '/ws';

type PendingRequest<T = unknown> = {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: string) => void;
};

interface SocketMessage<T = unknown> {
  id: string;
  data?: T;
  error?: string;
}

interface SocketRequestPayload<TParams = unknown> {
  id: string;
  route: string;
  params: TParams;
}

interface RNMessageEvent {
  data: string;
}

interface AnonSocketRequestPayload<TParams = unknown> {
  route: string;
  method: string;
  params: TParams;
}

type PersistObject = Record<string, AnonSocketRequestPayload<any>>;

const storageKey = 'life-in-order-pending';

const saveToDevice = async (value: PersistObject) => {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

const getFromDevice = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(storageKey);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to fetch data', e);
  }
};

class SocketClient {
  private socket: WebSocket | null = null;
  private pending: Map<string, PendingRequest<any>> = new Map();
  private persist: PersistObject = {};
  private connected: boolean = false;
  private attempt: number = 0;
  private baseDelay: number = 1000;
  private maxDelay: number = 30000;
  private appIsActive: boolean = false;
  private internetIsReachable: boolean = false;
  private netInfoUnsubscribe: NetInfoSubscription | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;
  private lastAccessToken: string | null = null;

  constructor() {
    this.socket = null;
    this.pending = new Map();
    this.connected = false;
    this.appIsActive = true;
    this.internetIsReachable = true;
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const newInternetIsReachable = state.isInternetReachable || false;
      if (newInternetIsReachable && !this.internetIsReachable) {
        this.scheduleReconnect();
      }
      this.internetIsReachable = newInternetIsReachable;
    });
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const newAppIsActive = nextAppState === 'active';
      if (!this.connected && !this.appIsActive && newAppIsActive) {
        this.scheduleReconnect();
      }
      this.appIsActive = newAppIsActive;
    });
    getFromDevice().then(persist => {
      this.persist = persist || {};
    });
  }

  connect(accessToken?: string) {
    return new Promise((resolve, reject) => {
      this.lastAccessToken = accessToken || this.lastAccessToken;
      if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
        resolve(true);
      }
      this.socket = new WebSocket(`${wsUrl}?t=${this.lastAccessToken}`);
      this.socket.onopen = () => {
        console.log('socket connected');
        this.connected = true;
        this.attempt = 0;
        const persistKeys = Object.keys(this.persist);
        persistKeys.forEach(pk => {
          const persistReq = this.persist[pk];
          if (!persistReq) return;
          const { route, method, params } = persistReq;
          delete this.persist[pk];
          this.persistRequest(pk, route, method, params);
        });
        resolve(true);
      }
      this.socket.onclose = () => {
        console.log('socket disconnected');
        this.connected = false;
      }
      this.socket.onerror = (e) => {
        console.log('WS error:', e);
        this.connected = false;
        if (this.appIsActive) {
          this.scheduleReconnect();
        }
        reject();
      };
      this.socket.onmessage = (e) => this.handleMessage(e);
    });
  }

  scheduleReconnect() {
    const exponential = Math.min(this.maxDelay, this.baseDelay * Math.pow(2, this.attempt));
    const delay = Math.floor(Math.random() * exponential);

    this.attempt++;
    console.log(`Reconnecting in ${delay}ms (Attempt ${this.attempt})...`);
    setTimeout(() => this.connect(), delay);
  }

  destroy() {
    if (this.netInfoUnsubscribe) this.netInfoUnsubscribe();
    if (this.appStateSubscription) this.appStateSubscription.remove();
    if (this.socket) this.socket.close();
  }

  private handleMessage(event: RNMessageEvent): void {
    let message: SocketMessage;
    try {
      message = JSON.parse(event.data);
    } catch {
      console.log('malformed: ', event.data);
      return; // ignore malformed frames
    }

    const { id, data, error } = message;
    const req = this.pending.get(id);
    if (!req) return; // no one is waiting on this response (or it already timed out)

    if (error) {
      req.reject(error);
    } else {
      req.resolve(data);
    }
    this.pending.delete(id);
  }

  persistRequest<T>(key: string, routeRaw: string, method: string, params: any) {
    const anonSocketRequestPayload = {
      route: routeRaw, method, params
    };
    this.persist[key] = anonSocketRequestPayload;
    saveToDevice(this.persist);
    return new Promise<T>((resolve, reject) => {
      this.request<T>(routeRaw, method, params).then(res => {
        delete this.persist[key];
        saveToDevice(this.persist);
        resolve(res);
      }).catch(e => {
        reject(e);
      })
    })
  }

  request<T>(routeRaw: string, method: string, params: any) {
    const id = Crypto.randomUUID();
    if (this.socket) {
      const route = `${routeRaw}-${method}`;
      const srp: SocketRequestPayload = { id, route, params };
      this.socket.send(JSON.stringify(srp));
    }
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  // Values
  setValue: SetValueSocket = (() => {
    const func: SetValueSocket = async (date, habitId, { valueId, text }) => {
      const route = 'values';
      const method = 'post';
      const params = {
        value_id: valueId,
        habit_id: habitId,
        date,
        text,
        number: null
      };
      const key = `setValue-${habitId}-${valueId}`;
      return this.persistRequest(key, route, method, params);
    };
    return debounce((date, habitId) => `${date}-${habitId}`, func, 1000);
  })();

  // Options
  createOption: CreateOptionSocket = (() => {
    const func: CreateOptionSocket = async (newOption) => {
      const route = 'options';
      const method = 'post';
      return this.request<Option>(route, method, newOption);
    };
    return debounce((_) => 'any', func, 300);
  })();

  updateOption: UpdateOptionSocket = (() => {
    const func: UpdateOptionSocket = async (newOption) => {
      const route = 'options';
      const method = 'put';
      return this.request<Option>(route, method, newOption);
    };
    return debounce((newOption) => newOption.id.toString(), func, 1000);
  })();

  reorderOptions: ReorderOptionsSocket = (() => {
    const func: ReorderOptionsSocket = async (ids) => {
      const route = 'options-reorder';
      const method = 'post';
      const params = { ordered_ids: ids }
      return this.request<boolean>(route, method, params);
    };
    return debounce((_) => 'any', func, 1000);
  })();

  deleteOption: DeleteOptionSocket = (id) => {
    const route = 'options';
    const method = 'delete';
    const params = id;
    return this.request<boolean>(route, method, params);
  }

  // Habits
  createHabit: CreateHabitSocket = (() => {
    const func: CreateHabitSocket = async (newHabit) => {
      const route = 'habits';
      const method = 'post';
      return this.request<Habit>(route, method, newHabit);
    };
    return debounce((_) => 'any', func, 300);
  })();

  updateHabit: UpdateHabitSocket = (() => {
    const func: UpdateHabitSocket = async (newHabit) => {
      const route = 'habits';
      const method = 'put';
      return this.request<Habit>(route, method, newHabit);
    };
    return debounce((newHabit) => newHabit.id.toString(), func, 1000);
  })();

  reorderHabits: ReorderHabitsSocket = (() => {
    const func: ReorderHabitsSocket = async (ids) => {
      const route = 'habits-reorder';
      const method = 'post';
      const params = { ordered_ids: ids }
      return this.request<boolean>(route, method, params);
    };
    return debounce((_) => 'any', func, 1000);
  })();

  deleteHabit: DeleteHabitSocket = (id) => {
    const route = 'habits';
    const method = 'delete';
    const params = id;
    return this.request<boolean>(route, method, params);
  }

  // List
  list = async (segment: Segment, width: number) => {
    const route = 'list';
    const method = 'get';
    const params = { ...segment, width };
    const data = await this.request<string>(route, method, params);
    return JSON.parse(data);
  }
}

export default new SocketClient();
