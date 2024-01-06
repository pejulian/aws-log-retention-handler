import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";
import { Ec2Client } from "./clients/ec2.client.js";
import { CloudwatchLogsClient } from "./clients/cloudwatch-logs.client.js";
import { Context } from "aws-lambda";

const logger = new Logger();

type CustomEvent = Readonly<{
  logGroupPaterrn: string;
  logRetentionPeriod: string;
}>;

const lambdaHandler = async (
  event: CustomEvent,
  context: Context
): Promise<void> => {
  if (isNaN(Number.parseInt(event.logRetentionPeriod))) {
    logger.error(
      `Provided logRetentionPeriod ${event.logRetentionPeriod} is not a number!`
    );

    return;
  }

  const retentionInDays = Number.parseInt(event.logRetentionPeriod);

  const ec2Client = new Ec2Client({ logger });

  const { Regions } = await ec2Client.describeRegions({
    AllRegions: false,
  });

  for await (const region of Regions ?? []) {
    if (region.RegionName) {
      logger.info(`Processing logs in the region ${region.RegionName}`);

      const cloudwatchLogsClient = new CloudwatchLogsClient({
        logger,
        clientOptions: {
          region: region.RegionName,
        },
      });

      const logGroups = await cloudwatchLogsClient.describeLogGroups();

      for await (const logGroup of logGroups) {
        if (
          event.logGroupPaterrn !== "ALL" &&
          !logGroup.logGroupName?.match(event.logGroupPaterrn)
        ) {
          logger.info(
            `${logGroup.logGroupName} does not match given pattern ${event.logGroupPaterrn}`
          );
          continue;
        }

        if (!logGroup.retentionInDays) {
          logger.debug(
            `The log group ${logGroup.logGroupName} is currently configured to never delete logs`
          );

          if (retentionInDays === 9999) {
            logger.info(`Nothing to change for ${logGroup.logGroupName}`);
            continue;
          }
        } else {
          logger.debug(
            `The log group ${logGroup.logGroupName} is currently configured to delete logs after ${logGroup.retentionInDays} days`
          );

          if (retentionInDays === logGroup.retentionInDays) {
            logger.info(`Nothing to change for ${logGroup.logGroupName}`);
            continue;
          }
        }

        logger.info(
          `Setting the log group ${logGroup.logGroupName} to delete logs after ${event.logRetentionPeriod} days`
        );

        let result: Awaited<
          ReturnType<
            | typeof cloudwatchLogsClient.deleteRetentionPolicy
            | typeof cloudwatchLogsClient.putRetentionPolicy
          >
        >;

        /**
         * In aws-cdk, 9999 days is equivalent to "never expire".
         * This is set by using "undefined" as the retentionInDays value in @aws-sdk
         */
        if (retentionInDays === 9999) {
          result = await cloudwatchLogsClient.deleteRetentionPolicy({
            logGroupName: logGroup.logGroupName,
          });
        } else {
          result = await cloudwatchLogsClient.putRetentionPolicy({
            logGroupName: logGroup.logGroupName,
            retentionInDays,
          });
        }

        if (
          (result.httpStatusCode ?? 0) > 199 &&
          (result.httpStatusCode ?? 0) < 300
        ) {
          logger.info(
            `Successfully applied new log retention policy to ${logGroup.logGroupName}`
          );
        }
      }
    }
  }
};

export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, { logEvent: true })
);
