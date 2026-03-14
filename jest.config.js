// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  // Redirect TypeScript source imports to compiled JS output in dist/
  moduleNameMapper: {
    '^((?:.*/)?)src/(.+)\\.js$': '$1dist/$2.js',
  },
  collectCoverageFrom: ['tools/lib/**/*.js'],
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
