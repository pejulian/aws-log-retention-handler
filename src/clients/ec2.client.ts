import { Logger } from "@aws-lambda-powertools/logger";
import {
  EC2Client,
  EC2ClientConfig,
  DescribeRegionsCommand,
  DescribeRegionsCommandOutput,
  EC2ServiceException,
  DescribeRegionsCommandInput,
} from "@aws-sdk/client-ec2";

export type Ec2ClientOptions = Readonly<{
  clientOptions?: EC2ClientConfig;
  logger: Logger;
}>;

export class Ec2Client {
  private readonly _client: EC2Client;
  private readonly _logger: Logger;

  constructor(options: Ec2ClientOptions) {
    this._client = new EC2Client(options.clientOptions ?? {});
    this._logger = options.logger.createChild();
  }

  public async describeRegions(
    options: DescribeRegionsCommandInput
  ): Promise<DescribeRegionsCommandOutput> {
    try {
      const command = new DescribeRegionsCommand({
        ...options,
      });

      const response = await this._client.send(command);

      return response;
    } catch (e) {
      this.logger.error(
        `An error occured while describing regions`,
        e instanceof EC2ServiceException ? e : `${e}`
      );
      throw e;
    }
  }

  public get logger(): Logger {
    return this._logger;
  }
}
