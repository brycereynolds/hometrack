export { cn } from "./cn.js";

export type WithElementRef<T, El extends HTMLElement = HTMLElement> = T & {
	ref?: El | null;
};
