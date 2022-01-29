module.exports = ({ exists, template, addToRoot }) => ({ name }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const filename = `${name}UseCase.js`;
  const destination = `src/application/use-cases/${filename}`;
  if (exists(destination)) {
    throw new Error(`Use-case "${filename}" already exists`);
  }

  template('src/application/UseCase.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('UseCase', name, './application/use-cases');

  console.log(`Use-case created at "${destination}"`);
};
