exports.up = ({ context: { query, Sequelize } }) => query.sequelize.transaction(async (transaction) => {
  await query.createTable('Owner', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  }, { transaction });

  await query.createTable('Item', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    OwnerId: {
      type: Sequelize.INTEGER,
      references: { model: 'Owner' },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
  }, { transaction });
});

exports.down = ({ context: { query } }) => query.sequelize.transaction(async (transaction) => {
  await query.dropTable('Item', { transaction });
  await query.dropTable('Owner', { transaction });
});
