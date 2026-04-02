export const sleep = (timeout: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  })
}

export const last = (arr: any[]) => arr.length === 0 ? null : arr[arr.length - 1];

export const dateDiff = (from: Date, to: Date) => {
  const daysToLast = Math.ceil((from.getTime() - to.getTime()) / (1000 * 60 * 60 * 24));
  return daysToLast;
};

export const dateDiffStr = (fromStr: string, toStr: string) => {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  return dateDiff(from, to);
};

export const dateString = (date: Date) => date.toISOString().split('T')[0]

export default { sleep, last };
