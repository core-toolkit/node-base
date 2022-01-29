/**
 * @param {Object} context
 * @param {Object.<string, Object>} context.Clients
 * @param {Object.<string, Object>} context.Models
 * @param {Object.<string, Object>} context.Services
 * @param {Object.<string, Object>} context.UseCases
 */
 module.exports = ({ Models: { __name__ } }) => {
  const getAll = () => User.findAll();

  const getById = (id) => User.findByPk(id);

  const create = async (author, name, value) => {
    const __nameLower__ = await User.create({ author, name, value });
    return { id: __nameLower__.id };
  };

  return {
    getAll,
    getById,
    create,
  };
};
