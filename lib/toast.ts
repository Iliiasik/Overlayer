export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  action?: ToastAction;
}

interface ToastOptions {
  description?: string;
  action?: ToastAction;
}

const TOAST_DURATION_MS = 5000;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function toast(title: string, options: ToastOptions = {}): void {
  const id = nextId++;
  toasts = [...toasts, { id, title, ...options }];
  emit();
  setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
}

export function dismissToast(id: number): void {
  if (!toasts.some((item) => item.id === id)) return;
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
