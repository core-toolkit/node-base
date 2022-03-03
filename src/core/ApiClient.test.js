const ApiClient = require('./ApiClient');

describe('ApiClient', () => {
  it('makes an api client factory', () => {
    const factory = ApiClient();
    expect(factory).toBeInstanceOf(Function);
  });

  it('makes an api client', () => {
    const factory = ApiClient();
    const client = factory();
    expect(client).toBeInstanceOf(Function);
  });

  it('makes requests', async () => {
    const mock = jest.fn().mockResolvedValue({ data: { data: 'foo' } });
    const factory = ApiClient(mock);
    const client = factory('bar');
    await expect(client({})).resolves.toBe('foo');
    expect(mock).toHaveBeenCalledWith({ baseURL: 'bar', headers: expect.any(Object) });
  });

  it('applies extra client headers', async () => {
    const mock = jest.fn().mockResolvedValue({ data: null });
    const factory = ApiClient(mock);
    const client = factory('', { TestHeader: 'Test' });
    await client({});
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({ TestHeader: 'Test' }),
    }));
  });

  it('applies extra client options', async () => {
    const mock = jest.fn().mockResolvedValue({ data: null });
    const factory = ApiClient(mock);
    const client = factory('', undefined, { method: 'TEST' });
    await client({});
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({ method: 'TEST' }));
  });

  it('applies extra request options', async () => {
    const mock = jest.fn().mockResolvedValue({ data: null });
    const factory = ApiClient(mock);
    const client = factory('bar', undefined, { method: 'TEST', TestOption: 'Test1' });
    await client({ TestOption: 'Test2', baseURL: 'foo' });
    expect(mock).toHaveBeenCalledWith({
      baseURL: 'foo',
      method: 'TEST',
      TestOption: 'Test2',
      headers: expect.any(Object),
    });
  });

  it('merges and overrides headers from extra request options', async () => {
    const mock = jest.fn().mockResolvedValue({ data: null });
    const factory = ApiClient(mock);
    const client = factory('', { TestHeader1: 'Test1', Foo: 'Bar' });
    await client({ headers: { Foo: 'Baz', TestHeader2: 'Test2' } });
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        TestHeader1: 'Test1',
        TestHeader2: 'Test2',
        Foo: 'Baz',
      }),
    }));
  });

  it('does not override headers from extra client options', async () => {
    const mock = jest.fn().mockResolvedValue({ data: null });
    const factory = ApiClient(mock);
    const client = factory('bar', { TestHeader1: 'Test1' }, { headers: { TestHeader2: 'Test2' } });
    await client({});
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({ TestHeader1: 'Test1' }),
    }));
    expect(mock).not.toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({ TestHeader2: 'Test2' }),
    }));
  });

  it('throws on api errors', async () => {
    const mock = jest.fn().mockRejectedValue({ response: { data: { error: 'foo' } } });
    const factory = ApiClient(mock);
    const client = factory();
    await expect(client({})).rejects.toBe('foo');
  });

  it('throws on request errors', async () => {
    const mock = jest.fn().mockRejectedValue('foo');
    const factory = ApiClient(mock);
    const client = factory();
    await expect(client({})).rejects.toBe('foo');
  });
});
