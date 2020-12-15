module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  coveragePathIgnorePatterns: ['.+.test.ts$'],
  setupFilesAfterEnv: ['./jest.setup.js'],
}
