export const debounce = (getKey: (...args: any) => string, func: (...args: any) => any, milis: number) => {
  const debounces: { [key: string]: ReturnType<typeof setTimeout> } = {};
  return (...args: any) => new Promise(resolve => {
    const key = getKey(...args);
    if (debounces[key]) {
      clearTimeout(debounces[key]);
    }
    debounces[key] = setTimeout(() => resolve(func(...args)), milis);
  });
};

export default { debounce };
