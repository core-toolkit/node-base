const assert = require('assert');
const FsMock = require('./FsMock');

const methods = ['copyFile', 'copyFileSync', 'existsSync', 'mkdir', 'mkdirSync', 'readdir', 'readdirSync', 'readFile', 'readFileSync', 'writeFile', 'writeFileSync',];

const dirtifyMock = (mock) => {
  if (Array.isArray(mock)) {
    mock.forEach((element) => dirtifyMock(element));
  } else if (mock && typeof mock === 'object') {
    dirtifyMock(Object.values(mock))
  } else if (typeof mock === 'function' && typeof mock.mockClear === 'function') {
    try {
      mock(()=>{});
    } catch (_) {}
  }
};

const assertClearedMock = (mock) => {
  if (Array.isArray(mock)) {
    mock.forEach((element) => assertClearedMock(element));
  } else if (typeof mock === 'object') {
    assertClearedMock(Object.values(mock))
  } else if (typeof mock === 'function' && typeof mock.mockClear === 'function') {
    assert(!mock.mock.calls.length);
  }
};

describe('FsMock', () => {
  it('creates a fs mock', () => {
    const fs = FsMock();
    expect(fs).toBeInstanceOf(Object);
    expect(fs).toHaveProperty('mockClear', expect.any(Function));
    expect(fs).toHaveProperty('mockReset', expect.any(Function));
    expect(fs).toHaveProperty('filesystem', expect.any(Object));
    expect(fs.filesystem).toEqual({ '/': null });
    for (const method of methods) {
      expect(fs).toHaveProperty(method, expect.any(Function));
    }
  });

  it('creates a fs mock with seeded data', () => {
    const fs = FsMock({ 'foo': 'bar', '/baz/qux': Buffer.from('quux'), 'test': null });
    expect(fs.filesystem).toEqual({
      '/': null,
      '/foo': Buffer.from('bar'),
      '/baz': null,
      '/baz/qux': Buffer.from('quux'),
      '/test': null,
    });
  });

  it('creates a fs mock with a different base', () => {
    const fs = FsMock({ 'foo': 'bar', '/baz/qux': Buffer.from('quux'), 'test': null }, '/tmp');
    expect(fs.filesystem).toEqual({
      '/': null,
      '/baz': null,
      '/baz/qux': Buffer.from('quux'),
      '/tmp': null,
      '/tmp/foo': Buffer.from('bar'),
      '/tmp/test': null,
    });
  });

  describe('mockClear', () => {
    it('clears all mocks', () => {
      const fs = FsMock();
      dirtifyMock(fs);
      fs.mkdirSync('/foo');
      fs.mockClear();
      assertClearedMock();
      expect(fs.filesystem).toHaveProperty('/foo', null);
    });
  });

  describe('mockReset', () => {
    it('clears all mocks and resets all changes', () => {
      const fs = FsMock({ '/foo': 'bar' });
      dirtifyMock(fs);
      fs.mkdirSync('/baz');
      fs.mockReset();
      assertClearedMock();
      expect(fs.filesystem).toHaveProperty('/foo', Buffer.from('bar'));
      expect(fs.filesystem).not.toHaveProperty('/baz');
    });
  });

  describe('.existsSync()', () => {
    it('returns whether a file or directory exists', () => {
      const fs = FsMock({ '/foo': 'bar' });
      expect(fs.existsSync('foo')).toBe(true);
      expect(fs.existsSync('/bar')).toBe(false);

      fs.filesystem['/bar'] = null;
      expect(fs.existsSync('/bar')).toBe(true);
    });
  });

  describe('.mkdirSync()', () => {
    it('creates directories', () => {
      const fs = FsMock();
      fs.mkdirSync('/foo/bar/..');
      expect(fs.filesystem).toHaveProperty('/foo', null);
    });
  });

  describe('.mkdir()', () => {
    it('creates directories', (done) => {
      const fs = FsMock();
      const mock = jest.fn((error) => {
        expect(error).toBe(undefined);
        expect(fs.filesystem).toHaveProperty('/foo', null);
        done();
      });
      fs.mkdir('/foo', mock);
    });
  });

  describe('.copyFileSync()', () => {
    it('copies files', () => {
      const fs = FsMock({ '/foo': 'bar' });
      fs.copyFileSync('/foo', './bar');
      expect(fs.filesystem).toHaveProperty('/bar', fs.filesystem['/foo']);
    });
  });

  describe('.copyFile()', () => {
    it('copies files', (done) => {
      const fs = FsMock({ '/foo': 'bar' });
      const mock = jest.fn((error) => {
        expect(error).toBe(undefined);
        expect(fs.filesystem).toHaveProperty('/baz', Buffer.from('bar'));
        done();
      });
      fs.copyFile('/foo', '/baz', mock);
    });
  });

  describe('.readFileSync()', () => {
    it('reads the contents of the file', () => {
      const fs = FsMock({ '/foo': 'bar' });
      const data = fs.readFileSync('/foo');
      expect(data).toEqual(Buffer.from('bar'));
    });
  });

  describe('.readFile()', () => {
    it('reads the contents of the file', (done) => {
      const fs = FsMock({ '/foo': 'bar' });
      const mock = jest.fn((error, data) => {
        expect(error).toBe(undefined);
        expect(data).toEqual(Buffer.from('bar'));
        done();
      });
      fs.readFile('/foo', mock);
    });
  });

  describe('.writeFileSync()', () => {
    it('writes data to a file', () => {
      const fs = FsMock();
      fs.writeFileSync('/foo', 'bar');
      expect(fs.filesystem).toHaveProperty('/foo', Buffer.from('bar'));
    });
  });

  describe('.writeFile()', () => {
    it('writes data to a file', (done) => {
      const fs = FsMock();
      const mock = jest.fn((error) => {
        expect(error).toBe(undefined);
        expect(fs.filesystem).toHaveProperty('/foo', Buffer.from('bar'));
        done();
      });
      fs.writeFile('/foo', 'bar', mock);
    });
  });

  describe('.readdirSync()', () => {
    it('lists the contents of a directory', () => {
      const fs = FsMock({ '/foo/bar': 'baz', '/foo/qux/quuux': '123' });
      const list = fs.readdirSync('/foo');
      expect(list).toEqual(['bar', 'qux']);
    });
  });

  describe('.readdir()', () => {
    it('lists the contents of a directory', (done) => {
      const fs = FsMock({ '/foo/bar': 'baz', '/foo/qux/quuux': '123' });
      const mock = jest.fn((error, data) => {
        expect(error).toBe(undefined);
        expect(data).toEqual(['bar', 'qux']);
        done();
      });
      fs.readdir('/foo', mock);
    });
  });
});
