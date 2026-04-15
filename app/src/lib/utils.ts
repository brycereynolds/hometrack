export { cn } from "./cn.js";

export type WithElementRef<T, El extends HTMLElement = HTMLElement> = T & {
	ref?: El | null;
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
