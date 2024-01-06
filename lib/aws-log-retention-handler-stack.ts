import path from "path";
import { fileURLToPath } from "url";
import { Duration, Stack, StackProps } from "aws-cdk-lib/core";
import { Architecture, Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CronOptions,
  Rule,
  RuleTargetInput,
  Schedule,
} from "aws-cdk-lib/aws-events";
import {
  LambdaFunction,
  addLambdaPermission,
} from "aws-cdk-lib/aws-events-targets";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AwsLogRetentionHandlerStackProps extends StackProps {
  cronOptions?: CronOptions;
  logLevel?: string;
  logGroupPattern?: string;
  logRetentionPeriod?: keyof typeof RetentionDays;
}

export class AwsLogRetentionHandlerStack extends Stack {
  public readonly function: Function;
  public readonly role: Role;
  public readonly rule: Rule;

  constructor(
    scope: Construct,
    id: string,
    props: AwsLogRetentionHandlerStackProps
  ) {
    super(scope, id, props);

    this.role = new Role(this, `LogRetentionHandlerRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: `log-retention-handler-role`,
      description: `Lambda execution role for the log retention handler function`,
      managedPolicies: [
        new ManagedPolicy(this, `Ec2Permissions`, {
          description: `Permissions for EC2 actions`,
          statements: [
            new PolicyStatement({
              actions: ["ec2:DescribeRegions"],
              effect: Effect.ALLOW,
              resources: ["*"],
            }),
          ],
        }),
        new ManagedPolicy(this, `CloudWatchLogPermissions`, {
          description: `Permissions for CloudWatch Logs actions`,
          statements: [
            new PolicyStatement({
              actions: [
                "logs:PutRetentionPolicy",
                "logs:DeleteRetentionPolicy",
                "logs:DescribeLogGroups",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              effect: Effect.ALLOW,
              resources: ["*"],
            }),
          ],
        }),
      ],
    });

    this.function = new Function(this, `LogRetentionHandlerFunction`, {
      runtime: Runtime.NODEJS_20_X,
      functionName: `log-retention-handler-function`,
      description: `Lambda function that enforces log retention period on log groups`,
      memorySize: 256,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(5),
      handler: "index.handler",
      code: Code.fromAsset(path.join(__dirname, "../build/lambda")),
      role: this.role,
      environment: {
        POWERTOOLS_SERVICE_NAME: "log-retention-handler",
        POWERTOOLS_LOG_LEVEL: props.logLevel ?? "INFO",
      },
    });

    this.rule = new Rule(this, `EventBridgeRule`, {
      ruleName: `LogRetentionHandlerRule`,
      description: `EventBridge CRON rule that triggers the ${this.function.functionName} function to enforce log retention periods on log groups`,
      schedule: Schedule.cron({
        day: props.cronOptions?.day ?? "*",
        hour: props.cronOptions?.hour ?? "2",
        minute: props.cronOptions?.minute ?? "0",
      }),
      targets: [
        new LambdaFunction(this.function, {
          event: RuleTargetInput.fromObject({
            logGroupPaterrn: props.logGroupPattern ?? "ALL",
            logRetentionPeriod:
              RetentionDays[
                props.logRetentionPeriod as keyof typeof RetentionDays
              ],
          }),
          retryAttempts: 3,
        }),
      ],
    });

    addLambdaPermission(this.rule, this.function);
  }
}
