const { resolve } = require('path');
const Project = require('./Project');
const props = [
  ['cmd', 'string'],
  ['path', 'string'],
  ['jsonPath', 'string'],
  ['rootPath', 'string'],
  ['configPath', 'string'],
  ['packagesPath', 'string'],
  ['name', 'string'],
  ['initialized', 'boolean'],
  ['packages', 'array'],
  ['nodeBase', 'object'],
];

describe('Project', () => {
  const mockProject = Project({ env: {}, cwd: () => '/foo' });

  it.each(props)('.%s is a %s', (prop, type) => {
    expect(mockProject).toHaveProperty(prop);
    if (type === 'array') expect(Array.isArray(mockProject[prop])).toBe(true);
    else if (type === 'null') expect(mockProject[prop]).toBe(null);
    else {
      if (type === 'object') expect(mockProject[prop]).toBeTruthy();
      expect(typeof mockProject[prop]).toBe(type);
    }
  });

  it('identifies uninitialized projects', () => {
    expect(mockProject.path).toBe('/foo');
    expect(mockProject.jsonPath).toBe('/foo/package.json');
    expect(mockProject.rootPath).toBe('/foo/src/root.js');
    expect(mockProject.configPath).toBe('/foo/src/config.js');
    expect(mockProject.packagesPath).toBe('/foo/packages');
    expect(mockProject.name).toBe('foo');
    expect(mockProject.initialized).toBe(false);
    expect(mockProject.packages.length).toBe(0);
    expect(mockProject.nodeBase).toEqual({ packages: [] });
  });

  it('identifies non-node-base projects', () => {
    const project = Project({ env: {}, cwd: () => __dirname });
    expect(project.cmd).toBe('node-base-cli');
    expect(project.path).not.toBe(__dirname);
    expect(project.name).toBe('node-base');
    expect(project.initialized).toBe(false);
    expect(project.packages).toContain('axios');
    expect(project.nodeBase).toEqual({ packages: [] });
  });

  it('identifies projects running under npm', () => {
    const nodeBase = {
      version: '1.0.0',
      packages: {
        api: '1.0.0',
        mq: '1.0.0',
      },
    };
    jest.mock('../../package.json', () => ({ ...jest.requireActual('../../package.json'), nodeBase }));

    const project = Project({ env: { npm_command: 'run-script' }, cwd: () => __dirname });
    expect(project.cmd).toBe('npm run cli');
    expect(project.path).not.toBe(__dirname);
    expect(project.name).toBe('node-base');
    expect(project.initialized).toBe(true);
    expect(project.nodeBase).toEqual(nodeBase);
  });
});
