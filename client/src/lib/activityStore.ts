import { useSyncExternalStore } from "react";
import type { SpeakerBandActivityMap } from "@/lib/bandActivity";

type Store<T> = {
  getSnapshot: () => T;
  publish: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export type ActivityStore = Store<Readonly<Record<string, number>>>;
export type BandActivityStore = Store<SpeakerBandActivityMap>;

function createStore<T>(initial: T): Store<T> {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    publish: (next) => { snapshot = next; listeners.forEach((listener) => listener()); },
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

export function createActivityStore(): ActivityStore {
  return createStore<Readonly<Record<string, number>>>({});
}

export function createBandActivityStore(): BandActivityStore {
  return createStore<SpeakerBandActivityMap>({});
}

export function useSpeakerActivity(store: ActivityStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useSpeakerBandActivity(store: BandActivityStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
