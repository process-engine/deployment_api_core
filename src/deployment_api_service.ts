import * as fs from 'fs';
import * as path from 'path';

import {UnauthorizedError} from '@essential-projects/errors_ts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {IDeploymentApiService, ImportProcessDefinitionsRequestPayload} from '@process-engine/deployment_api_contracts';

import {
  ExecutionContext,
  IExecutionContextFacade,
  IExecutionContextFacadeFactory,
  IProcessModelService,
} from '@process-engine/process_engine_contracts';

export class DeploymentApiService implements IDeploymentApiService {

  private _processModelService: IProcessModelService;
  private _executionContextFacadeFactory: IExecutionContextFacadeFactory;

  constructor(executionContextFacadeFactory: IExecutionContextFacadeFactory, processModelService: IProcessModelService) {
    this._executionContextFacadeFactory = executionContextFacadeFactory;
    this._processModelService = processModelService;
  }

  private get executionContextFacadeFactory(): IExecutionContextFacadeFactory {
    return this._executionContextFacadeFactory;
  }

  private get processModelService(): IProcessModelService {
    return this._processModelService;
  }

  public async importBpmnFromXml(identity: IIdentity, payload: ImportProcessDefinitionsRequestPayload): Promise<void> {

    this._ensureIsAuthorized(identity);

    const newExecutionContext: ExecutionContext = new ExecutionContext(identity);

    const executionContextFacade: IExecutionContextFacade = this.executionContextFacadeFactory.create(newExecutionContext);

    await this.processModelService.persistProcessDefinitions(executionContextFacade, payload.name, payload.xml, payload.overwriteExisting);
  }

  public async importBpmnFromFile(identity: IIdentity,
                                  filePath: string,
                                  name?: string,
                                  overwriteExisting: boolean = true,
                                 ): Promise<void> {

    this._ensureIsAuthorized(identity);

    if (!filePath) {
      throw new Error('file does not exist');
    }

    const parsedFileName: path.ParsedPath = path.parse(filePath);
    const xml: string = await this._getXmlFromFile(filePath);

    const importPayload: ImportProcessDefinitionsRequestPayload = {
      name: name || parsedFileName.name,
      xml: xml,
      overwriteExisting: overwriteExisting,
    };

    await this.importBpmnFromXml(identity, importPayload);
  }

  private async _getXmlFromFile(filePath: string): Promise<string> {
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

  private _ensureIsAuthorized(identity: IIdentity): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    if (!identity || typeof identity.token !== 'string') {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
