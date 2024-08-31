# AWS Log Retention Handler

This project deploys a solution to enforce the specified log retention policy on log groups in enabled regions on a given target account.

This provides an automated way of ensuring that log groups adhere to the desired retention period and prevent costs from escalating due to accumating log group sizes.

## Context values

These variables are defined in the [repository variables](https://github.com/pejuian/aws-log-retention-handler/settings/variables/actions) section for _actions secrets and variables_
and are configured to be used in the [./github/workflows/deploy.yml](./.github/workflows/deploy.yml) file.

| Context value        | Actions variable       | Description                                                                                                                                                                       |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cronHour`           | `CRON_HOUR`            | Describe at what hour(s) should the event trigger the lambda                                                                                                                      |
| `cronMinute`         | `CRON_MINUTE`          | Describe at what minute(s) should the event trigger the lambda                                                                                                                    |
| `cronDay`            | `CRON_DAY`             | Describe at what day(s) should the event trigger the lambda                                                                                                                       |
| `logLevel`           | `LOG_LEVEL`            | Set the log level verbosity. Read more [here](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#log-levels)                                                   |
| `logRetentionPeriod` | `LOG_RETENTION_PERIOD` | Sets the retention days of streams in the log group. Read [this](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.RetentionDays.html#members) for possible values |
| `logGroupPattern`    | `LOG_GROUP_PATTERN`    | A regular expression string of log group names on which the given log retention period should be applied on. Defaults to ALL log groups if not specified.                         |

## Utilizing the stack

You can either specify a synthesize, deploy or destroy operation using the `CDK_COMMAND` environment variable.

Additional flags can be passed to the CDK command using the `CDK_FLAGS` environment variable.

> NOTE: Configure `cdk` related options using [Github environment variables](https://github.com/pejulian/aws-log-retention-handler/settings/environments)

---

Before you can use the workflow configured in this repo for any of the operations above, you must ensure that the target AWS region in your account where the deployment is to be made has been **bootstrapped**.

Bootstrap:

```bash
./cdk-bootstrap.sh my-iam@012345678912 us-east-1 --context "logRetentionPeriod=ONE_DAY" --context "logGroupPattern=(\/aws\/lambda\/|API-Gateway-Execution).*"
```

> NOTE: A local AWS IAM User profile is used here to bootstrap CDK against the `us-east-1` region.
