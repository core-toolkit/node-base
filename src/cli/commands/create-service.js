module.exports = ({ name }, { exists, template, addToRoot }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const basePath = 'src/infrastructure/services';
  const filename = `${name}Service.js`;
  const destination = `${basePath}/${filename}`;
  if (exists(destination)) {
    throw new Error(`Service "${filename}" already exists`);
  }

  const testFilename = `${name}Service.test.js`;
  const testDestination = `${basePath}/${testFilename}`;

  template('src/infrastructure/Service.js', destination, { name });
  template('src/infrastructure/Service.test.js', testDestination, { name });
  addToRoot('Service', name, './infrastructure/services');

  console.log(`Service created at "${destination}"`);
  console.log(`Test created at "${testDestination}"`);
};
