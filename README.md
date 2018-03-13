# Flowbject

Flowbject allows you to build, validate and test your state-machine JSON in a more convenient way by interacting with Objects. This has many use-cases such as local state-flow validation, custom middlewares such as task identity resolvers, Tasks input/output mocking for flow-testing.

The concept is based on [Amazon-State-Language](https://states-language.net/spec.html).


## Installation

```bash
npm install flowbject
```

## Usage

### Simple task build

```typescript
import * as fobject from 'flowbject';


const stateMachine = new fobject.StateMachine();

const readImage = new fobject.Task('readImageFromS3')
    .setResource('arn::...');

const convertToThumbnail = new fobject.Task('convertToThumbnail')
    .setResource('arn::...');

const saveImage = new fobject.Task('saveToS3')
    .setResource('arn::...');

stateMachine
    .addState(readImage)
    .addState(convertToThumbnail)
    .addState(saveImage)
    .autoNextSetup(); // setup the tasks next-field automatically

const generator = new fobject.StepFunctionsGenerator();

const data = generator.generateStateMachine(stateMachine);
```

Output:

```json
{
    "StartAt": "readImageFromS3",
    "States": {
        "readImageFromS3": {
            "Type": "Task",
            "Resource": "arn::...",
            "Next": "convertToThumbnail"
        },
        "convertToThumbnail": {
            "Type": "Task",
            "Resource": "arn::...",
            "Next": "saveToS3"
        },
        "saveToS3": {
            "Type": "Task",
            "Resource": "arn::...",
            "End": true
        }
    }
}
```
