import axios from 'axios';
import * as Crypto from 'expo-crypto';
import type { GetUserMapPureResponse, Habit, MacroMap, SetValueSocket, Option, ZoomLevel, DeleteOption, DeleteOptionSocket } from '../types';
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

  deleteOption: DeleteOptionSocket = (id) => {
    const route = 'options';
    const method = 'delete';
    const params = id;
    return this.request<boolean>(route, method, params);
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

export const deleteHabitServer = async (id: string) => {
  try {
    const route = `${baseUrl}/habits/${parseInt(id, 10)}`;
    const res = await axios.delete(route);
    return res.status === 200;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
};

const reorderGeneralServer = async (route: string, ids: string[]) => {
  try {
    const res = await axios.post(route, {
      ordered_ids: ids
    });
    return res.status === 200;
  } catch (error) {
    console.error('Error reordering:', error);
    return false;
  }
};

export const reorderHabitsServer = (() => {
  const func = async (ids: string[]) => {
    const route = `${baseUrl}/habits/reorder`;
    return reorderGeneralServer(route, ids);
  };
  return debounce(() => 'any', func, 1000);
})();

export const reorderValuesServer =  (() => {
  const func = async (ids: string[]) => {
    const route = `${baseUrl}/options/reorder`;
    return reorderGeneralServer(route, ids);
  };
  return debounce(() => 'any', func, 1000);
})();

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

export const updateValueServer = (() => {
  const func = async (newValue: Option) => {
    try {
      const route = `${baseUrl}/options`;
      const res = await axios.put(route, newValue);
      return res.status === 200;
    } catch (error) {
      console.error('Error updating value:', error);
      return false;
    }
  };
  return debounce(() => 'any', func, 1000);
})();

export const updateHabitServer = (() => {
  const func = async (newHabit: Habit) => {
    try {
      const route = `${baseUrl}/habits`;
      const res = await axios.put(route, newHabit);
      return res.status === 200;
    } catch (error) {
      console.error('Error updating habit:', error);
      return false;
    }
  };
  return debounce(() => 'any', func, 1000);
})();

export default new SocketClient();
