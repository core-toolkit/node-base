#!/usr/bin/env node

const CreateApplication = require('./root');
const config = require('./config');

const { StartCli } = CreateApplication(config);
StartCli();
