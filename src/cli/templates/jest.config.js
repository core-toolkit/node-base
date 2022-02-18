module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/*.js',
    '!src/application/routes/*.js',
    '!src/application/controllers/*.js',
    '!src/infrastructure/clients/*.js',
    '!src/infrastructure/models/*.js',
    '!src/infrastructure/migrations/*.js',
  ],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['./node_modules/', './packages/'],
  silent: false,
  forceExit: true,
  verbose: true,
  testEnvironment: 'node',
};
