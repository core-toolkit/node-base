const assert = require('assert');
const { DataTypes, Model, ModelAttributes, ModelOptions, Sequelize } = require('sequelize');

const pending = new Set();

/**
 * @typedef ModelDefinition
 * @property {String} name
 * @property {ModelAttributes} definition
 * @property {ModelOptions} options
 * @property {Object.<string, Function>} associations
 *
 * @param {(DataTypes)=>ModelDefinition} makeModel
 * @param {Sequelize} sequelize
 * @returns {Model}
 */
module.exports = (makeModel, sequelize) => {
  assert(typeof makeModel === 'function', '');
  const { name, definition, options = {}, associations = {} } = makeModel(DataTypes);

  assert(name && typeof name === 'string', 'Invalid model name');
  assert(definition && typeof definition === 'object', 'Invalid model definition');
  assert(typeof options === 'object', 'Invalid model options');
  assert(typeof associations === 'object', 'Invalid model associations');
  for (const name of Object.keys(associations)) {
    assert(typeof associations[name] === 'function', `Model association ${name} must be a function`);
  }

  const model = sequelize.define(name, definition, {
    timestamps: false,
    freezeTableName: true,
    ...options,
    sequelize,
  });

  for (const target of Object.keys(associations)) {
    const assocFn = associations[target];
    pending.add({
      target,
      associate: (targetModel) => assocFn(model, targetModel),
    });
  }
  for (const association of pending) {
    const targetModel = sequelize.models[association.target];
    if (targetModel) {
      association.associate(targetModel);
      pending.delete(association);
    }
  }

  return model;
};
