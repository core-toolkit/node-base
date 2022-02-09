const CreateApplication = require('./root');
const config = require('./config');

const { start } = CreateApplication(config);
start();
