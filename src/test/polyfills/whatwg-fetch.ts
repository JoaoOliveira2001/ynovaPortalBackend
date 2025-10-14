if (typeof globalThis.fetch !== 'function') {
  throw new Error('Global fetch API is not available. Please provide a polyfill in the test environment.')
}

export {}
