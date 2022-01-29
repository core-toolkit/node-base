module.exports = ({ __name__UseCase }) => {
  const getAll = () => __name__UseCase.getAll();

  const get = async ({ params: { id } }, { Errors }) => {
    const __nameLower__ = await __name__UseCase.getById(id);
    if (!__nameLower__) {
      throw new Errors.NotFound('__name__');
    }
    return __nameLower__;
  };

  const add = ({ body: { name, value }, user }, { Errors }) => {
    const validation = new Errors.Validation();

    if (name === undefined) {
      validation.add('name', 'Missing');
    } else if (typeof name !== 'string') {
      validation.add('name');
    } else if (!name.trim()) {
      validation.add('name', 'Empty');
    }

    if (value === undefined) {
      validation.add('value', 'Missing');
    } else if (typeof value !== 'number') {
      validation.add('value');
    } else if (value < 0 || value > 100) {
      validation.add('value', 'Out of range', 'Must be between 0 and 100');
    }

    if (validation.invalid) {
      throw validation;
    }

    return __name__UseCase.create(user.id, name, value);
  };

  return {
    getAll,
    get,
    add,
  };
};
