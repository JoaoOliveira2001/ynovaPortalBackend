import 'whatwg-fetch'
import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserver {
    callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    observe() {}

    unobserve() {}

    disconnect() {}
  }

  // @ts-expect-error polyfill assign
  globalThis.ResizeObserver = ResizeObserver
}
