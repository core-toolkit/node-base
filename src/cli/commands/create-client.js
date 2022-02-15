module.exports = ({ name }, { exists, template, addToRoot }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const basePath = 'src/infrastructure/clients';
  const filename = `${name}Client.js`;
  const destination = `${basePath}/${filename}`;
  if (exists(destination)) {
    throw new Error(`Client "${filename}" already exists`);
  }

  template('src/infrastructure/Client.js', destination, { name });
  addToConfig('src/config-client.js', { name, nameUpper: name.toUpperCase() });
  addToRoot('Client', name, './infrastructure/clients');

  console.log(`Client created at "${destination}"`);
};
