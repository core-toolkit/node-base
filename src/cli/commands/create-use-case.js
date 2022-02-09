module.exports = ({ name }, { exists, template, addToRoot }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const basePath = 'src/application/use-cases';
  const filename = `${name}UseCase.js`;
  const destination = `${basePath}/${filename}`;
  if (exists(destination)) {
    throw new Error(`Use-case "${filename}" already exists`);
  }

  template('src/application/UseCase.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('UseCase', name, './application/use-cases');

  console.log(`Use-case created at "${destination}"`);
};
