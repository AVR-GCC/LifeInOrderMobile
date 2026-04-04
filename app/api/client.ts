import axios from 'axios';
import type { Habit, Value, ZoomLevel } from '../types';
import { getZoomModeRange } from '../constants/zoom';

// const baseUrl = 'http://10.0.0.6:8080'; // TODO: Make this configurable via environment variables
const baseUrl = 'http://192.168.1.174:8080'; // TODO: Make this configurable via environment variables

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

const getUserListPure = async (date: string, zoom: ZoomLevel, count: number, width: number) => {
  try {
    // console.log('getUserListPure date, zoom, count', date, zoom, count);
    const route = `${baseUrl}/users/1/list?date=${date}&zoom=${zoom}&count=${count}&width=${width}`;
    const config = zoom !== 'day' ? { responseType: 'arraybuffer' as const } : {};
    const res = await axios.get(route, config);
    // console.log('getUserListPure', date);
    if (res.data?.length) {
      // console.log('getUserListPure res.data', JSON.stringify(res.data, null, 2));
      return res.data;
    } else {
      const base64String = res.request._response;
      const image = `data:image/webp;base64,${base64String}`;
      const range = getZoomModeRange(date, zoom, count);
      // console.log('getUserListPure range', range);
      return [{ range, image }];
    }
  } catch (error) {
    console.error('Error fetching user list:', error);
    return null;
  }
};

export const debounce = (func: (...args: any) => any, milis: number) => {
  let deb: ReturnType<typeof setTimeout> | null = null;
  return (...args: any) => new Promise(resolve => {
    if (deb) clearTimeout(deb);
    deb = setTimeout(() => resolve(func(...args)), milis);
  });
};

export const throttleGetUserList = () => {
  const recent: Record<string, number> = {};
  const fun = async(date: string, zoom: ZoomLevel, count: number, width: number) => {
    const now = Date.now();
    const key = `${zoom}-${date}`;
    const expiration = (recent[key] || 0) + 2000;
    if (expiration > now) return;
    recent[key] = now;
    return getUserListPure(date, zoom, count, width);
  };
  return fun;
}

export const getUserList = throttleGetUserList();

type SetDayValueServer = (date: string, habitId: string, valueId: string) => void;

export const setDayValueServer: SetDayValueServer = (() => {
  const debounces: { [key: string]: ReturnType<typeof setTimeout> } = {};
  const func: SetDayValueServer = async (date, habitId, valueId) => {
    try {
      await axios.post(`${baseUrl}/day_values`, {
        value_id: valueId,
        habit_id: habitId,
        date,
        text: null,
        number: null
      });
    } catch (error) {
      console.error('Error setting day value:', error);
    }
  };
  
  const debounced: SetDayValueServer = (date, habitId, valueId) => {
    const key = `${date}-${habitId}`;
    if (debounces[key]) clearTimeout(debounces[key]);
    debounces[key] = setTimeout(() => func(date, habitId, valueId), 1000);
  };
  return debounced;
})();

export const createHabitServer = async (newHabit: Partial<Habit>) => {
  try {
    const route = `${baseUrl}/user_habits`;
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
    const route = `${baseUrl}/user_habits/${parseInt(id, 10)}`;
    const res = await axios.delete(route);
    return res.status === 200;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
};

const reorderGeneralServerUndebounced = async (route: string, ids: string[]) => {
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

export const reorderHabitsServerUndebounced = async (ids: string[]) => {
  const route = `${baseUrl}/user_habits/reorder`;
  return reorderGeneralServerUndebounced(route, ids);
};

export const reorderValuesServerUndebounced = async (ids: string[]) => {
  const route = `${baseUrl}/habit_values/reorder`;
  return reorderGeneralServerUndebounced(route, ids);
};

export const reorderHabitsServer = debounce(reorderHabitsServerUndebounced, 1000);

export const reorderValuesServer = debounce(reorderValuesServerUndebounced, 1000);

export const deleteValueServer = async (id: string) => {
  try {
    const route = `${baseUrl}/habit_values/${parseInt(id, 10)}`;
    const res = await axios.delete(route);
    return res.status === 200;
  } catch (error) {
    console.error('Error deleting value:', error);
    return false;
  }
};

export const createValueServer = async (newValue: Partial<Value>) => {
  try {
    const route = `${baseUrl}/habit_values`;
    const res = await axios.post(route, newValue);
    return res.data;
  } catch (error) {
    console.error('Error creating value:', error);
    return false;
  }
};

const updateValueServerUndebounced = async (newValue: Value) => {
  try {
    const route = `${baseUrl}/habit_values`;
    const res = await axios.put(route, newValue);
    return res.status === 200;
  } catch (error) {
    console.error('Error updating value:', error);
    return false;
  }
};

export const updateHabitServerUndebounced = async (newHabit: Habit) => {
  try {
    const route = `${baseUrl}/user_habits`;
    const res = await axios.put(route, newHabit);
    return res.status === 200;
  } catch (error) {
    console.error('Error updating habit:', error);
    return false;
  }
};

export const updateValueServer = debounce(updateValueServerUndebounced, 1000);
export const updateHabitServer = debounce(updateHabitServerUndebounced, 1000);

export default {
  getUserList,
  setDayValueServer,
  updateHabitServer,
  deleteHabitServer,
  reorderHabitsServer,
  reorderValuesServer,
  updateValueServer,
  deleteValueServer
}; 
