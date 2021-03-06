import * as fs from 'fs';
import * as path from 'path';

import {UnauthorizedError} from '@essential-projects/errors_ts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {IDeploymentApi, ImportProcessDefinitionsRequestPayload} from '@process-engine/deployment_api_contracts';

import {IProcessModelUseCases} from '@process-engine/process_model.contracts';

export class DeploymentApiService implements IDeploymentApi {

  private processModelUseCases: IProcessModelUseCases;

  constructor(processModelUseCases: IProcessModelUseCases) {
    this.processModelUseCases = processModelUseCases;
  }

  public async importBpmnFromXml(identity: IIdentity, payload: ImportProcessDefinitionsRequestPayload): Promise<void> {
    this.ensureIsAuthorized(identity);

    await this.processModelUseCases.persistProcessDefinitions(identity, payload.name, payload.xml, payload.overwriteExisting);
  }

  public async importBpmnFromFile(
    identity: IIdentity,
    filePath: string,
    name?: string,
    overwriteExisting: boolean = true,
  ): Promise<void> {

    this.ensureIsAuthorized(identity);

    if (!filePath) {
      throw new Error('file does not exist');
    }

    const parsedFileName = path.parse(filePath);
    const xml = await this.getXmlFromFile(filePath);

    const importPayload = {
      name: name || parsedFileName.name,
      xml: xml,
      overwriteExisting: overwriteExisting,
    };

    await this.importBpmnFromXml(identity, importPayload);
  }

  public async undeploy(identity: IIdentity, processModelId: string): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.processModelUseCases.deleteProcessModel(identity, processModelId);
  }

  private async getXmlFromFile(filePath: string): Promise<string> {
    return new Promise<string>((resolve: Function, reject: Function): void => {
      fs.readFile(filePath, 'utf8', (error: Error, xmlString: string): void => {
        if (error) {
          reject(error);
        } else {
          resolve(xmlString);
        }
      });
    });
  }

  private ensureIsAuthorized(identity: IIdentity): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    if (!identity || typeof identity.token !== 'string') {
      throw new UnauthorizedError('No auth token provided!');
    }
  }

}
