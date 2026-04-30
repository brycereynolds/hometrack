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

// Remove 'children' from props (for components that render their own children)
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;

// Remove 'child' from props
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;

// Remove both 'children' and 'child' from props
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
