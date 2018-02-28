# NodeJS State Language DSL

``UNDER DEVELOPMENT``

NodeJS DSL builder based on State Machine language of [Amazon-State-Language](https://states-language.net/spec.html).

## Motivation

This package allows you to build, validate and test you state-machine JSON in a more convenient way by interacting with Objects. The project is written in OOP style and allows you to interact and build you state-machine at runtime. This has many use-cases such as local flow validation, custom middlewares such as task identity resolvers, Tasks input/output mocking for flow-testing.

The final goal is to provide an state-machine-editor with visualization in which the user will be able to build his own custom state-machine using a visualized version of the state-machine without state-language familiarity.

## Usage Examples

### States

#### Task

Get or create an item using the catcher task branch:

```typescript
import {Task} from '../src/states';

const getItem = new Task('getItem').setResource('arn..');
const createItem = new Task('createItem').setResource('arn..');

getItem
    .catch.errors(['NotFoundError']).next.toState(createItem);
```

Setup retry:

```typescript
import {Task} from '../src/states';

const getItem = new Task('getItem').setResource('arn..');

const getItemRetrier = getItem.retry.all(); // returns a Retrier instance associated to getItem task

getItemRetrier.setInterval(2); // set custom interval

```

### Generator

In order to create the step-functions JSON it is necessary to instantiate a `Generator` and a `StateMachine`:

```typescript
import { StepFunctionsGenerator } from '../src/generators/StepFunctionsGenerator';
import { StateMachine } from '../src/StateMachine';

const generator = new StepFunctionsGenerator();

const stateMachine = new StateMachine();

stateMachine
    .addState(getItem)
    .addState(createItem);

const stepFunctionsJSON = generator.generateStateMachine(stateMachine);

```

## TODO

### Not implemented states

- Choice
- Wait
- Succeeed
- Fail


third party features using this package.

- Flow validation
- Middleware to mock tasks input/ouput
- Middleware Lambda Task reference resolver
- Build State-machine from JSON (reversed dump)
- State-machine visualization
