module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/*.js', '!src/**/(routes|controllers|clients)/*.js'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['./node_modules/', './packages/'],
  silent: false,
  forceExit: true,
  verbose: true,
  testEnvironment: 'node',
};
