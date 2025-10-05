import { afterAll, afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';

class TestResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  // @ts-expect-error - provide minimal stub for jsdom
  window.ResizeObserver = TestResizeObserver;
}
import { server } from './msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

