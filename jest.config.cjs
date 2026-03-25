
// const tsconfig = require('./tsconfig.json');
// const tsconfigPathsJest = require('tsconfig-paths-jest');

// module.exports = {
//   testEnvironment: 'jsdom',
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
//   moduleNameMapper: {
//     // ✅ Handle images first, before tsconfig path resolution
//     '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
//     "^@/lib/supabaseClient$": "<rootDir>/__mocks__/lib/supabaseClient.ts",
//     // ✅ Styles
//     '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',

//     // ✅ Then handle tsconfig paths
//     ...tsconfigPathsJest(tsconfig),
//   },
//   transform: {
//     '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.config.cjs' }],
//   },
//   testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  
//   // on testing threeshold 
//   collectCoverage: true,

//   coverageThreshold: {
//     global: {
//       branches: 90,
//       functions: 90,
//       lines: 90,
//       statements: 90,
//     },
//   },

  
// };

const tsconfig = require('./tsconfig.json');
const tsconfigPathsJest = require('tsconfig-paths-jest');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
    "^@/lib/supabaseClient$": "<rootDir>/__mocks__/lib/supabaseClient.ts",
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
    ...tsconfigPathsJest(tsconfig),
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.config.cjs' }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.[jt]s?(x)'],
      // ✅ No setupFilesAfterEnv — jest.setup.cjs uses window which doesn't exist in node
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.config.cjs' }],
      },
      moduleNameMapper: {
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
        "^@/lib/supabaseClient$": "<rootDir>/__mocks__/lib/supabaseClient.ts",
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
        ...tsconfigPathsJest(tsconfig),
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/__tests__/**/*.test.[jt]s?(x)'],
      testPathIgnorePatterns: ['<rootDir>/__tests__/api/'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.jest.config.cjs' }],
      },
      moduleNameMapper: {
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
        "^@/lib/supabaseClient$": "<rootDir>/__mocks__/lib/supabaseClient.ts",
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
        ...tsconfigPathsJest(tsconfig),
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
    },
  ],
};