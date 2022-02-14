/**
 * @param {Object} context
 * @param {Object.<string, Object>} context.Util
 * @param {Object.<string, Object>} context.Core
 * @param {Object.<string, Object>} context.Client
 * @param {Object.<string, Object>} context.Model
 * @param {Object.<string, Object>} context.Service
 * @param {Object.<string, Object>} context.UseCase
 * @param {Object.<string, (...arg: any) => void>} context.Log
 */
 module.exports = ({ Model: { __name__ } }) => {
  const getAll = () => __name__.findAll();

  const getById = (id) => __name__.findByPk(id);

  const create = async (author, name, value) => {
    const __nameLower__ = await __name__.create({ author, name, value });
    return { id: __nameLower__.id };
  };

  return {
    getAll,
    getById,
    create,
  };
};
