
const tsconfig = require('./tsconfig.json');
const tsconfigPathsJest = require('tsconfig-paths-jest');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    // ✅ Handle images first, before tsconfig path resolution
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
    "^@/lib/supabaseClient$": "<rootDir>/__mocks__/lib/supabaseClient.ts",
    // ✅ Styles
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',

    // ✅ Then handle tsconfig paths
    ...tsconfigPathsJest(tsconfig),
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.config.cjs' }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
