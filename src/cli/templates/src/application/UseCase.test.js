const __name__UseCase = require('./__name__UseCase');

describe('__name__UseCase', () => {
  describe('.getAll()', () => {
    it('fetches a list of all __name__ entries', async () => {
      const mock = jest.fn();
      const useCase = __name__UseCase({ Models: { __name__: { findAll: mock } } });

      const items = await useCase.getAll();
      expect(items).toContain(expect.objectContaining({ id: 1, name: 'foo', value: 'abc' }));
      expect(items).toContain(expect.objectContaining({ id: 2, name: 'bar', value: 'def' }));
    });
  });

  describe('.getById()', () => {
    it('fetches a single __nameLower__', async () => {
      const mock = jest.fn();
      const useCase = __name__UseCase({ Models: { __name__: { findByPk: mock } } });

      const item = await useCase.getById(1);
      expect(item).toBe(expect.objectContaining({ id: 1, name: 'foo', value: 'abc', extendedProperty: 'extra' }));
    });

    it('does not fetch missing __nameLower__ items', async () => {
      const mock = jest.fn();
      const useCase = __name__UseCase({ Models: { __name__: { findByPk: mock } } });

      const item = await useCase.getById(-1);
      expect(item).toBeFalsy();
    });
  });

  describe('.create()', () => {
    it('creates a __nameLower__', async () => {
      const mock = jest.fn();
      const useCase = __name__UseCase({ Models: { __name__: { create: mock } } });

      const newItem = await useCase.create('test name', 'test value');
      expect(typeof newItem.id).toBe('number');

      const item = await useCase.getById(newItem.id);
      expect(item).toBe(expect.objectContaining({ name: 'test name', value: 'test value' }));
    });
  });
});
