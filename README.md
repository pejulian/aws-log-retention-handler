# AWS Log Retention Handler

This project deploys a solution to enforce the specified log retention policy on log groups in enabled regions on a given target account.

This provides an automated way of ensuring that log groups adhere to the desired retention period and prevent costs from escalating due to accumating log group sizes.

## Context values

| Context value        | Description                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cronHour`           | Describe at what hour(s) should the event trigger the lambda                                                                                                                      |
| `cronMinute`         | Describe at what minute(s) should the event trigger the lambda                                                                                                                    |
| `cronDay`            | Describe at what day(s) should the event trigger the lambda                                                                                                                       |
| `logLevel`           | Set the log level verbosity. Read more [here](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#log-levels)                                                   |
| `logRetentionPeriod` | Sets the retention days of streams in the log group. Read [this](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.RetentionDays.html#members) for possible values |
| `logGroupPattern`    | A regular expression string of log group names on which the given log retention period should be applied on. Defaults to ALL log groups if not specified.                         |

## Utilizing the stack

> Use the pre-made `cdk-*.sh` scripts in the repository root to reduce manual steps for deployment

---

The deployment requires a role that has relevant access to provision all required resources on the target account.

The examples below assume you have configured a role on your local machine to accomplish this.

> Replace `my-iam@012345678912` with a relevant named profile stored in `~/.aws/credentials`

---

The examples below deploys the solution to the `us-east-1` region. Change as needed.

Change context values to fit your requirements.

---

Synthesize cloudformation template:

```bash
./cdk-synth.sh my-iam@012345678912 us-east-1 --context "logRetentionPeriod=ONE_DAY" --context "logGroupPattern=(\/aws\/lambda\/|API-Gateway-Execution).*"
```

> This does not deploy anything. The command will only create the necessary Cloudformation templates and package all assets locally to be ready for deployment. You can use this command to verify that your code compiles properly and that CDK is able to generate Cloudformation templates for deployment.

---

Bootstrap:

```bash
./cdk-bootstrap.sh my-iam@012345678912 us-east-1 --context "logRetentionPeriod=ONE_DAY" --context "logGroupPattern=(\/aws\/lambda\/|API-Gateway-Execution).*"
```

---

Deploy:

```bash
./cdk-deploy.sh my-iam@012345678912 us-east-1 --context "logRetentionPeriod=ONE_DAY" --context "logGroupPattern=(\/aws\/lambda\/|API-Gateway-Execution).*"
```

---

Destroy

```bash
./cdk-destroy.sh my-iam@012345678912 us-east-1 --context "logRetentionPeriod=ONE_DAY" --context "logGroupPattern=(\/aws\/lambda\/|API-Gateway-Execution).*"
```
