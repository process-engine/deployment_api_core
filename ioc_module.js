'use strict';

const DeploymentApiService = require('./dist/commonjs/index').DeploymentApiService;

function registerInContainer(container) {

  container
    .register('DeploymentApiService', DeploymentApiService)
    .dependencies('ProcessModelUseCases')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
