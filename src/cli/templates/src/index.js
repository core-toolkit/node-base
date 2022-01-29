const CreateApplication = require('./root');
const config = require('./config');

const { StartServer } = CreateApplication(config);
StartServer();
