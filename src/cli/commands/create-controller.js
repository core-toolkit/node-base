module.exports = ({ exists, template, addToRoot }) => ({ name }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const filename = `${name}Controller.js`;
  const destination = `src/application/controllers/${filename}`;
  if (exists(destination)) {
    throw new Error(`Controller "${filename}" already exists`);
  }

  template('src/application/Controller.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('Controller', name, './application/controllers');

  console.log(`Controller created at "${destination}"`);
};
