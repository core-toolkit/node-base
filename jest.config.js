module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/core/*.js', 'src/services/*.js', 'src/utils/*.js'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['./node_modules/', './src/cli/templates/'],
  silent: false,
  forceExit: true,
  verbose: true,
  testEnvironment: 'node',
};
