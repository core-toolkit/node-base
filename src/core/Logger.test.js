const Logger = require('./Logger');

const expectedMethods = [
  ['l', 'log'],
  ['i', 'info'],
  ['e', 'error'],
  ['d', 'log'],
  ['log', 'log'],
  ['info', 'info'],
  ['error', 'error'],
  ['debug', 'log'],
];

const levelMapping = {
  log: 'DEBUG',
  info: 'INFO',
  error: 'ERROR',
};

describe('Logger', () => {
  it('makes a logger factory', () => {
    const factory = Logger();
    expect(factory).toBeInstanceOf(Object);
  });

  it('makes arbitrary loggers', () => {
    const factory = Logger();

    expect(factory.LoggerName1).toBeInstanceOf(Object);
    expect(factory.LoggerName2).toBeInstanceOf(Object);

    factory.LoggerName3 = 'foo';
    expect(factory.LoggerName3).toBeInstanceOf(Object);
  });

  it('produces correctly padded logs', () => {
    const mock = jest.fn();
    const factory = Logger({ log: mock, info: mock, error: mock });

    const logger1 = factory.ShortName;
    logger1.log('foo');
    expect(mock).toHaveBeenCalled();

    const initialPaddingLength = mock.mock.calls[0][0].length;

    const logger2 = factory.MediumLengthName;
    const logger3 = factory.ALoggerWithAVeryLongName;

    mock.mockClear();

    logger1.log({});
    logger2.info(123);
    logger3.error(['a', 'b', 'c']);
    expect(mock).toHaveBeenCalledTimes(3);

    const newPaddingLength = mock.mock.calls[0][0].length;
    expect(newPaddingLength).toBeGreaterThan(initialPaddingLength);

    const leadingPaddings = mock.mock.calls.map(([leadingArg]) => leadingArg);
    for (const padding of leadingPaddings) {
      expect(padding.length).toBe(newPaddingLength);
    }
  });

  describe.each(expectedMethods)('.%s()', (method, underlyingMethod) => {
    it('is a function', () => {
      const factory = Logger();
      expect(factory.LoggerName[method]).toBeInstanceOf(Function);

      factory.LoggerName[method] = 'foo';
      expect(factory.LoggerName[method]).toBeInstanceOf(Function);
    });

    it('logs to the console', () => {
      const mock = jest.fn();
      const arg1 = {}, arg2 = 'foo', arg3 = 123;
      const factory = Logger({ [underlyingMethod]: mock });

      factory.LoggerName[method](arg1, arg2, arg3);
      expect(mock).toHaveBeenCalledWith(expect.stringContaining('LoggerName'), arg1, arg2, arg3);
      expect(mock).toHaveBeenCalledWith(expect.stringContaining(levelMapping[underlyingMethod]), arg1, arg2, arg3);
    });
  });
});
