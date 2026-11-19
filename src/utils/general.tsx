import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';

export const sleep = (timeout: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  })
}

export const last = (arr: any[]) => arr.length === 0 ? null : arr[arr.length - 1];

export const dateDiff = (late: Date, early: Date) => {
  const daysToLast = Math.ceil((late.getTime() - early.getTime()) / (1000 * 60 * 60 * 24));
  return daysToLast;
};

export const dateDiffStr = (fromStr: string, toStr: string) => {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  return dateDiff(from, to);
};

export const dateString = (date: Date) => date.toISOString().split('T')[0]

export const generateEightDigitNumber = () => {
  const bytes = Crypto.getRandomBytes(4);
  const value = new DataView(bytes.buffer).getUint32(0);
  return 10000000 + (value % 90000000);
}

export const tryCatchBlock = async <T = unknown>(tryFunc: () => Promise<T>, text2: string) => {
  try {
    return await tryFunc();
  } catch (err) {
    if (err instanceof Error) {
      Toast.show({
        type: 'error',
        text1: err.message,
        text2,
      });
    } else if (typeof err === 'string') {
      Toast.show({
        type: 'error',
        text1: err,
        text2,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Unknown Error',
        text2,
      });
    }
    return null;
  }
}

export default {
  generateEightDigitNumber,
  dateDiff,
  dateDiffStr,
  dateString,
  sleep,
  last
};
