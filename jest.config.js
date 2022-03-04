module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/(core|services|utils|mocks)/*.js'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['./node_modules/', './src/cli/templates/'],
  silent: false,
  forceExit: true,
  verbose: true,
  testEnvironment: 'node',
};
