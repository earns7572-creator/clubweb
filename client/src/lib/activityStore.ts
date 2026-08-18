import { useSyncExternalStore } from "react";

export type ActivityStore = {
  getSnapshot: () => Readonly<Record<string, number>>;
  publish: (next: Record<string, number>) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createActivityStore(): ActivityStore {
  let snapshot: Readonly<Record<string, number>> = {};
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    publish: (next) => { snapshot = next; listeners.forEach((listener) => listener()); },
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

export function useSpeakerActivity(store: ActivityStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
