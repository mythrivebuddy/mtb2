// const tsconfig = require('./tsconfig.json');
// const tsconfigPathsJest = require('tsconfig-paths-jest');

// module.exports = {
//   testEnvironment: 'jsdom',
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
//   // moduleNameMapper: {
//   //   ...tsconfigPathsJest(tsconfig),
//   //   '^@/public/.*\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
//   //   '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
//   //   '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
//   // },
// //   moduleNameMapper: {
// //   ...tsconfigPathsJest(tsconfig),
// //   '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',
// //   '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
// // },
//   moduleNameMapper: {
//     ...tsconfigPathsJest(tsconfig),

//     // ✅ Explicitly handle @/public alias
//     '^@/public/(.*)$': '<rootDir>/__mocks__/fileMock.cjs',

//     // ✅ Fallback for any image import
//     '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',

//     // ✅ Styles
//     '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
//   },

//   transform: {
//     '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
//   },
//   testPathIgnorePatterns: ['/node_modules/', '/.next/'],
// };
const tsconfig = require('./tsconfig.json');
const tsconfigPathsJest = require('tsconfig-paths-jest');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    // ✅ Handle images first, before tsconfig path resolution
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.cjs',

    // ✅ Styles
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',

    // ✅ Then handle tsconfig paths
    ...tsconfigPathsJest(tsconfig),
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
