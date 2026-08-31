export const debounce = <TArgs extends any[], TReturn>(
  getKey: (...args: TArgs) => string,
  func: (...args: TArgs) => TReturn,
  milis: number
): ((...args: TArgs) => Promise<Awaited<TReturn>>) => {
  const debounces: { [key: string]: ReturnType<typeof setTimeout> } = {};
  return (...args: TArgs) => new Promise((resolve) => {
    const key = getKey(...args);
    if (debounces[key]) {
      clearTimeout(debounces[key]);
    }
    debounces[key] = setTimeout(async () => resolve(await func(...args)), milis);
  });
};

export default { debounce };
