module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/js/**/*.js',
    'login/js/**/*.js',
    '!**/*.spec.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {},
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: false
};
