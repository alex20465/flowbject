# Flowbject

Flowbject is a high-level library whose aim is to help with writing state-machine flows. The concept is based on [Amazon-State-Language](https://states-language.net/spec.html).

It provides a more convenient way to write and manipulate states. The state-machine JSON extraction is encapsulated in hydrators and allows the integration of multiple API languages such as AWS-StepFunctions.

## Installation

```bash
npm install flowbject
```

## Usage

Here is an example how to build a state-machine and extract the language-specifications to AWS-StepFunctions.

```typescript
import { StateMachine, Pass, AWSStepFunctionsHydratorManager } from "flowbject";

const stateMachine = new StateMachine({
    autoLink: true,
    comment: 'A Hello World example of the Amazon States Language using a Pass state'
});

const helloWorld = (new Pass('HelloWorld')).result.set('Hello World!')

stateMachine.states.add(helloWorld);

const manager = new AWSStepFunctionsHydratorManager();

const result = manager.extractStateMachine(stateMachine);
```

Results:

```json
{
    "Comment": "A Hello Worldexample of the Amazon States Language using a Pass state",
    "StartAt": "HelloWorld",
    "States": {
        "HelloWorld": {
            "Result": "Hello World!",
            "End": true,
            "Type": "Pass"
        }
    }
}
```