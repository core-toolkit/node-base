module.exports = ({ exists, template, addToRoot }) => ({ name }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const filename = `${name}Routes.js`;
  const destination = `src/application/routes/${filename}`;
  if (exists(destination)) {
    throw new Error(`Route "${filename}" already exists`);
  }

  template('src/application/Routes.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('Routes', name, './application/routes', true);

  console.log(`Routes created at "${destination}"`);
};
