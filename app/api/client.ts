import axios from 'axios';
import type { Habit, MainProps, Value } from '../types';

const baseUrl = 'http://10.0.0.8:8080'; // TODO: Make this configurable via environment variables

export const getUserList = async () => {
  try {
    const route = `${baseUrl}/users/1/list`;
    const res = await axios.get<MainProps>(route);
    if (res.data) {
      const { dates, habits } = res.data;
      return { dates, habits };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user list:', error);
    return null;
  }
};

export const debounce = (func: (args: any) => any, milis: number) => {
  let deb: ReturnType<typeof setTimeout> | null = null;
  return (args: any) => {
    if (deb) clearTimeout(deb);
    deb = setTimeout(() => func(args), milis);
  };
};

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

export const updateValueServer = debounce(updateValueServerUndebounced);
export const updateHabitServer = debounce(updateHabitServerUndebounced);

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
