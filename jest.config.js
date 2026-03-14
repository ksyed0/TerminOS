// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  // Redirect TypeScript source imports to compiled JS output in dist/
  moduleNameMapper: {
    '^((?:.*/)?)src/(.+)\\.js$': '$1dist/$2.js',
  },
  collectCoverageFrom: [
    // Tools (plain JS utilities)
    'tools/lib/**/*.js',
    // Compiled TypeScript src — testable modules only
    // (Electron entry, preload context-bridge, renderer DOM, and IPC handlers
    //  require a full Electron/browser environment and are excluded here)
    'dist/main/config/store.js',
    'dist/main/providers/claude.js',
    'dist/main/providers/openai.js',
    'dist/main/providers/ollama.js',
    'dist/main/providers/factory.js',
    'dist/main/pty/manager.js',
    'dist/renderer/theme.js',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
};
