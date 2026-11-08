import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Newer Node versions ship an experimental global `localStorage` that shadows jsdom's and
// has no working methods without a flag. Use a small in-memory implementation instead.
const createStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(String(key)) ? data.get(String(key)) : null),
    setItem: (key, value) => void data.set(String(key), String(value)),
    removeItem: (key) => void data.delete(String(key)),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
};
Object.defineProperty(globalThis, "localStorage", { value: createStorage(), configurable: true, writable: true });

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
