const fs = require('fs');
const { basename, dirname, resolve } = require('path');

/**
 * @typedef Process
 * @property {() => String} cwd
 * @property {Object.<string, String>} env
 *
 * @typedef Project
 * @property {String} cmd
 * @property {String} path
 * @property {String} jsonPath
 * @property {String} rootPath
 * @property {String} configPath
 * @property {String} name
 * @property {boolean} initialized
 *
 * @param {Process} process
 * @returns {Project}
 */
module.exports = (process) => {
  const cwd = process.cwd();

  const project = {
    cmd: process.env.npm_command ? 'npm run cli' : 'node-base-cli',
    path: cwd,
    name: basename(cwd),
    initialized: true,
    packages: [],
  };

  while (!fs.existsSync(resolve(project.path, 'package.json'))) {
    if (project.path.length <= 1) {
      project.initialized = false;
      project.path = cwd;
      break;
    };
    project.path = dirname(project.path);
  }

  project.jsonPath = resolve(project.path, 'package.json');
  project.rootPath = resolve(project.path, 'src/root.js');
  project.configPath = resolve(project.path, 'src/config.js');
  project.packagesPath = resolve(project.path, 'packages');

  if (project.initialized) {
    const packageJson = require(project.jsonPath);
    project.name = packageJson.name;
    project.packages = Object.keys(packageJson.dependencies);
  }

  return project;
};
