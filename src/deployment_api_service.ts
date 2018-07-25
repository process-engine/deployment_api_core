import {UnauthorizedError} from '@essential-projects/errors_ts';
import {DeploymentContext, IDeploymentApiService, ImportProcessModelRequestPayload} from '@process-engine/deployment_api_contracts';

import {
  ExecutionContext,
  IExecutionContextFacade,
  IExecutionContextFacadeFactory,
  IProcessModelService,
} from '@process-engine/process_engine_contracts';

import {IIdentity} from '@essential-projects/iam_contracts';

import * as fs from 'fs';

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

  public async importBpmnFromXml(context: DeploymentContext, payload: ImportProcessModelRequestPayload): Promise<void> {

    this._ensureIsAuthorized(context);

    const identity: IIdentity = {
      token: context.identity,
    };

    const newExecutionContext: ExecutionContext = new ExecutionContext(identity);

    const executionContextFacade: IExecutionContextFacade = this.executionContextFacadeFactory.create(newExecutionContext);

    await this.processModelService.persistProcessDefinitions(executionContextFacade, payload.name, payload.xml, payload.overwriteExisting);
  }

  public async importBpmnFromFile(context: DeploymentContext,
                                  filePath: string,
                                  processName?: string,
                                  overwriteExisting: boolean = true,
                                 ): Promise<void> {

    this._ensureIsAuthorized(context);

    if (!filePath) {
      throw new Error('file does not exist');
    }

    // filePath will be something like "/someFilePath/process_file_name.bpmn"
    // The part we want to use with the import is "process_file_name".
    const fileName: string = filePath.split('/').pop();

    const nameWithoutExtension: string = processName || fileName.split('.')[0];
    const xml: string = await this._getXmlFromFile(filePath);

    const importPayload: ImportProcessModelRequestPayload = {
      name: nameWithoutExtension,
      xml: xml,
      overwriteExisting: overwriteExisting,
    };

    await this.importBpmnFromXml(context, importPayload);
  }

  private async _getXmlFromFile(path: string): Promise<string> {
    return new Promise<string>((resolve: Function, reject: Function): void => {
      fs.readFile(path, 'utf8', (error: Error, xmlString: string): void => {
        if (error) {
          reject(error);
        } else {
          resolve(xmlString);
        }
      });
    });
  }

  private _ensureIsAuthorized(context: DeploymentContext): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    if (!context || !context.identity) {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
