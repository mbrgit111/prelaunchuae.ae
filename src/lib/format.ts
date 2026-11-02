export const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;
export const absoluteUrl = (path: string, base: string) => new URL(path, base).toString();
