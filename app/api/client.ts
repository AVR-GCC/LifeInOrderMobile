import axios from 'axios';
import * as Crypto from 'expo-crypto';

import type { GetUserMapPureResponse, Habit, MacroMap, SetValueSocket, DeleteHabitSocket, UpdateHabitSocket, ReorderHabitsSocket, Option, ZoomLevel, DeleteOptionSocket, UpdateOptionSocket, ReorderOptionsSocket, CreateOptionSocket, CreateHabitSocket, Segment, ZoomLevelData } from '../types';
import { getZoomModeRange } from '../constants/zoom';
import { emptyDatesData, mapToLoadParams } from '../utils/dataStructures';
import { debounce } from '../utils/API';

const baseAddress = process.env.EXPO_PUBLIC_API_BASE;

const baseUrl = `http://${baseAddress}`;
const WS_URL = `ws://${baseAddress}/ws`;

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

// socketClient.js
class SocketClient {
  private socket: WebSocket | null = null;
  private pending: Map<string, PendingRequest<any>> = new Map();

  constructor() {
    this.socket = null;
    this.pending = new Map(); // requestId -> { resolve, reject }
  }

  connect() {
    this.socket = new WebSocket(WS_URL);
    this.socket.onopen = () => {
      console.log('socket connected');
    }
    this.socket.onclose = () => {
      console.log('socket disconnected');
    }
    this.socket.onerror = (e) => {
      // this.connected = false;
      console.log('WS error:', e);
    };
    this.socket.onmessage = (e) => this.handleMessage(e);
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
      return this.request<Option>(route, method, params);
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
  list = (segment: Segment) => {
    const route = 'list';
    const method = 'get';
    const params = segment;
    return this.request<ZoomLevelData>(route, method, params);
  }
}

export const getUserConfig = async () => {
  try {
    const route = `${baseUrl}/users/1/config`;
    const res = await axios.get(route);
    if (res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user config:', error);
    return null;
  }
};

export const getUserList = async (date: string, zoom: ZoomLevel, count: number, width: number) => {
  try {
    // console.log('getUserList date, zoom, count', date, zoom, count);
    const route = `${baseUrl}/users/1/list?date=${date}&zoom=${zoom}&count=${count}&width=${width}`;
    const config = zoom !== 'day' ? { responseType: 'arraybuffer' as const } : {};
    const res = await axios.get(route, config);
    // console.log('getUserList', date);
    if (res.data?.length) {
      // console.log('getUserList res.data', JSON.stringify(res.data, null, 2));
      return res.data;
    } else {
      const base64String = res.request._response;
      const image = `data:image/webp;base64,${base64String}`;
      const range = getZoomModeRange(date, zoom, count);
      // console.log('getUserList range', range);
      return [{ range, image, zoom }];
    }
  } catch (error) {
    console.error('Error fetching user list:', error);
    return null;
  }
};

export const getUserMap = async (map: MacroMap, isBefore: boolean, id: number, width: number) => {
  // console.log('getUserMap', width, isBefore ? 'before' : 'after');
  // printMacroMap(map);
  const inputs = mapToLoadParams(map);
  const datesData = emptyDatesData();
  await Promise.all(inputs.map(async({ date, zoom, count }) => {
    datesData[zoom] = await getUserList(date, zoom, count, width);
  }));
  const res: GetUserMapPureResponse = { id, map, datesData, isBefore };
  return res;
};

export const createHabitServer = async (newHabit: Partial<Habit>) => {
  try {
    const route = `${baseUrl}/habits`;
    const withUserId = { user_id: 1, ...newHabit };
    const res = await axios.post(route, withUserId);
    return res.data;
  } catch (error) {
    console.error('Error creating habit:', error);
    return false;
  }
};

export const createValueServer = async (newValue: Partial<Option>) => {
  try {
    const route = `${baseUrl}/options`;
    const res = await axios.post(route, newValue);
    return res.data;
  } catch (error) {
    console.error('Error creating value:', error);
    return false;
  }
};

export default new SocketClient();
