import "@testing-library/jest-dom";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import React, { act } from "react";

// Configure React Testing Library for React 19
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 5000,
});

// Fix React.act compatibility for React 19
// React 19 has act as a separate export, but React Testing Library expects it on the React object
Object.defineProperty(React, 'act', {
  value: act,
  writable: false,
  configurable: false
});

// Global React for compatibility
globalThis.React = React;

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    return { type: "img", props: { src, alt, ...props } };
  },
}));

// Mock database client to prevent real connections during unit tests
vi.mock("@/drizzle/client", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
  closeDatabase: vi.fn(),
}));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VITEST", "true");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
  vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
  vi.stubEnv("NEXTAUTH_SECRET", "test-secret-key-minimum-32-characters-long");
  vi.stubEnv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/container_mm_test");
  vi.stubEnv("API_URL", "http://localhost:8080");
});

const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

export const resetTestEnvironment = (): void => {
  cleanup();
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
};

export const stubEnvironmentVariables = (
  envVars: Record<string, string>
): void => {
  Object.entries(envVars).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });
};

export const createMockFetch = (data: unknown, status = 200): unknown => {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  );
};
