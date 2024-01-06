#!/usr/bin/env node
import "source-map-support/register";

import { App, Environment, Tags } from "aws-cdk-lib/core";
import { AwsLogRetentionHandlerStack } from "../lib/aws-log-retention-handler-stack.js";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

const app = new App();

const cronMinute = app.node.tryGetContext(`cronMinute`);
const cronHour = app.node.tryGetContext(`cronHour`);
const cronDay = app.node.tryGetContext(`cronDay`);
const logLevel = app.node.tryGetContext(`logLevel`);
const logGroupPattern = app.node.tryGetContext(`logGroupPattern`);
const logRetentionPeriod = app.node.tryGetContext(`logRetentionPeriod`);

if (!logRetentionPeriod) {
  throw new Error("Missing logRetentionPeriod context value");
}

if (!Object.keys(RetentionDays).includes(logRetentionPeriod)) {
  throw new Error(
    `Illegal value ${logRetentionPeriod} for logRetentionPeriod context value`
  );
}

const env: Environment = {
  account: process.env.CDK_DEPLOY_ACCOUNT ?? process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION ?? process.env.CDK_DEFAULT_REGION,
};

const awsLogRetentionHandlerStack = new AwsLogRetentionHandlerStack(
  app,
  "AwsLogRetentionHandlerStack",
  {
    env,
    logLevel,
    logGroupPattern,
    logRetentionPeriod,
    cronOptions: {
      minute: cronMinute,
      hour: cronHour,
      day: cronDay,
    },
  }
);

[awsLogRetentionHandlerStack].forEach((stack) => {
  Tags.of(stack).add(`StackCategory`, "infrastructure");
  Tags.of(stack).add(`StackSubCategory`, `cloudwatch_logs`);
});
