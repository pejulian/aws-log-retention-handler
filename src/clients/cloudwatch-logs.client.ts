import { Logger } from "@aws-lambda-powertools/logger";
import {
  CloudWatchLogsClient,
  CloudWatchLogsClientConfig,
  paginateDescribeLogGroups,
  CloudWatchLogsServiceException,
  LogGroup,
  DescribeLogGroupsCommandInput,
  PutRetentionPolicyCommand,
  PutRetentionPolicyCommandInput,
  DeleteRetentionPolicyCommand,
  DeleteRetentionPolicyCommandInput,
} from "@aws-sdk/client-cloudwatch-logs";

export type CloudwatchLogsClientOptions = Readonly<{
  clientOptions?: CloudWatchLogsClientConfig;
  logger: Logger;
}>;

export class CloudwatchLogsClient {
  private readonly _client: CloudWatchLogsClient;
  private readonly _logger: Logger;

  constructor(options: CloudwatchLogsClientOptions) {
    this._client = new CloudWatchLogsClient(options.clientOptions ?? {});
    this._logger = options.logger.createChild();
  }

  public async putRetentionPolicy(options: PutRetentionPolicyCommandInput) {
    try {
      const command = new PutRetentionPolicyCommand(options);

      const result = await this._client.send(command);

      return result.$metadata;
    } catch (e) {
      this.logger.error(
        `An error occured while putting retention policy ${options.retentionInDays} for ${options.logGroupName}`,
        e instanceof CloudWatchLogsServiceException ? e : `${e}`
      );
      throw e;
    }
  }

  public async deleteRetentionPolicy(
    options: DeleteRetentionPolicyCommandInput
  ) {
    try {
      const command = new DeleteRetentionPolicyCommand(options);

      const result = await this._client.send(command);

      return result.$metadata;
    } catch (e) {
      this.logger.error(
        `An error occured while deleting retention policy for ${options.logGroupName}`,
        e instanceof CloudWatchLogsServiceException ? e : `${e}`
      );
      throw e;
    }
  }

  public async describeLogGroups(
    options?: DescribeLogGroupsCommandInput
  ): Promise<Array<LogGroup>> {
    try {
      const paginatedLogGroups = paginateDescribeLogGroups(
        { client: this._client },
        options ?? {}
      );
      const logGroups: Array<LogGroup> = [];

      for await (const page of paginatedLogGroups) {
        if (page.logGroups && page.logGroups.every((lg) => !!lg)) {
          logGroups.push(...page.logGroups);
        }
      }

      return logGroups;
    } catch (e) {
      this.logger.error(
        `An error occured while describing regions`,
        e instanceof CloudWatchLogsServiceException ? e : `${e}`
      );
      throw e;
    }
  }

  public get logger(): Logger {
    return this._logger;
  }
}
