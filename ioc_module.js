'use strict';

const DeploymentApiService = require('./dist/commonjs/index').DeploymentApiService;

function registerInContainer(container) {

  container
    .register('DeploymentApiService', DeploymentApiService)
    .dependencies('ExecutionContextFacadeFactory', 'ProcessModelService')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
