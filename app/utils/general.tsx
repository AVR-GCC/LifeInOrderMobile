export const sleep = (timeout: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  })
}

export const last = (arr: any[]) => arr.length === 0 ? null : arr[arr.length - 1];

export default { sleep, last };
