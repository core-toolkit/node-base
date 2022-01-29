const supportedAlgos = ['EdDSA'];

module.exports = ({ read, partial }) => ({ algo, header }) => {
  if (!supportedAlgos.includes(algo)) {
    throw new Error(`Unsupported dialect ${algo}, must be one of: [${supportedAlgos.join(', ')}]`)
  }

  const configPath = 'src/config.js';
  const config = read(configPath);
  if (/[^ ]  auth:/.test(config)) {
    throw new Error('Auth already initialized');
  }

  partial('src/config-auth.js.partial', configPath, '};', true, { algo, header });
};
