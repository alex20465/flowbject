import { expect } from 'chai';
import { StepFunctionsGenerator } from '../src/generators';
import { StateMachine } from '../src/StateMachine';
import { State, Pass, Task, Parallel, Fail, Succeed, Wait, Choice, CHOICE_COMPARATOR_RULE, CHOICE_LOGIC_RULE } from '../src/states';

describe('AWSStepFunctions', () => {
    describe('generateField', () => {
        let generator: StepFunctionsGenerator;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
        });

        it('should generate field next', () => {
            const state = (new Pass('foo')).next.end();
            const data = generator.generateField(state.next);
            expect(data).to.deep.equal({
                End: true
            });
        });
    });

    describe('generateState', () => {
        let generator: StepFunctionsGenerator;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
        });

        it('should generate state pass', () => {
            const state = (new Pass('foo')).next.end();
            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Pass',
                End: true
            });
        });

        it('should generate state task', () => {
            const stateNotFoundTask = new Task('notFoundHandler');
            const state = (new Task('foo'))
                .setResource('XY')
                .setTimeout(30)
                .setHeartbeat(10)
                .next.end();

            // setup not found catcher
            const notFoundCatcher = state.catch.errors(['NotFoundError']);
            notFoundCatcher.next.to(stateNotFoundTask);

            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Task',
                Resource: 'XY',
                TimeoutSeconds: 30,
                HeartbeatSeconds: 10,
                End: true,
                Catch: [
                    {
                        ErrorEquals: ["NotFoundError"],
                        Next: "notFoundHandler"
                    },
                ]
            });
        });

        it('should generate state parallel', () => {
            const generateImage = new Parallel('generateImage');

            const generateThumbnail = new Task('generateThumbail').setResource('arn::xy').next.end();
            const generatePortrait = new Task('generatePortrait').setResource('arn::xy').next.end();

            generateImage.addBranch().addState(generateThumbnail);
            generateImage.addBranch().addState(generatePortrait);
            generateImage.next.end();
            const data = generator.generateState(generateImage);

            expect(data).to.deep.equal({
                Type: "Parallel",
                Branches: [
                    {
                        StartAt: "generateThumbail",
                        States: {
                            generateThumbail: {
                                Type: "Task",
                                Resource: "arn::xy",
                                End: true
                            }
                        }
                    },
                    {
                        StartAt: "generatePortrait",
                        States: {
                            generatePortrait: {
                                Type: "Task",
                                Resource: "arn::xy",
                                End: true
                            }
                        }
                    }
                ],
                End: true
            })
        });

        it('should generate complex state task', () => {
            const stateNotFoundTask = new Task('notFoundHandler');
            const fatalErrorTask = new Task('fatalErrorHandler');

            const state = (new Task('foo')).setResource('XY').next.end();

            // setup not found catcher
            const notFoundCatcher = state.catch.errors(['NotFoundError']);
            notFoundCatcher.next.to(stateNotFoundTask);

            // setup fatal error catcher
            const fatalErrorCatcher = state.catch.errors(['FatalError', 'ServerError']);
            fatalErrorCatcher.next.to(fatalErrorTask);
            fatalErrorCatcher.resultPath.set('$.errorMessage');

            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Task',
                Resource: 'XY',
                End: true,
                Catch: [
                    {
                        ErrorEquals: ["NotFoundError"],
                        Next: "notFoundHandler"
                    },
                    {
                        ErrorEquals: ["FatalError", "ServerError"],
                        Next: "fatalErrorHandler",
                        ResultPath: "$.errorMessage"
                    }
                ]
            });
        });

        it('should generate state task with retries', () => {
            const state = (new Task('foo')).setResource('XY').next.end();
            const retrier = state.retry.timeout();
            retrier.setBackoffRate(3);
            retrier.setMaxAttempts(3);
            retrier.setInterval(2);
            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Task',
                Resource: 'XY',
                End: true,
                Retry: [
                    {
                        ErrorEquals: [
                            'States.Timeout'
                        ],
                        BackoffRate: 3,
                        IntervalSeconds: 2,
                        MaxAttempts: 3
                    }
                ]
            });
        });

        it('should generate simple comparator state choice operation', () => {
            const handleFoo = (new Task('foo')).setResource('xy').next.end();
            const handleBar = (new Task('bar')).setResource('xy').next.end();

            const state = (new Choice('isFoo'));

            state.createComparatorRule(CHOICE_COMPARATOR_RULE.STRING_EQUALS)
                .setVariable('$.type')
                .setValue('foo')
                .next.to(handleFoo);

            state.defaultTo(handleBar);

            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Choice',
                Choices: [
                    {
                        StringEquals: 'foo',
                        Variable: '$.type',
                        Next: 'foo'
                    }
                ],
                Default: 'bar'
            });
        });

        it('should generate simple logic state choice operation', () => {
            const handleFoo = (new Task('foo')).setResource('xy').next.end();
            const handleBar = (new Task('bar')).setResource('xy').next.end();

            const state = (new Choice('isFoo'));
            const andOperation = state.createLogicRule(CHOICE_LOGIC_RULE.AND);


            andOperation.createComparatorRule(CHOICE_COMPARATOR_RULE.STRING_EQUALS)
                .setVariable('$.type')
                .setValue('foo')

            andOperation.createComparatorRule(CHOICE_COMPARATOR_RULE.STRING_EQUALS)
                .setVariable('$.secondType')
                .setValue('foo')

            andOperation.next.to(handleFoo);
            state.defaultTo(handleBar);

            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Choice',
                Choices: [
                    {
                        And: [
                            {
                                Variable: '$.type',
                                StringEquals: 'foo'
                            },
                            {
                                Variable: '$.secondType',
                                StringEquals: 'foo'
                            }
                        ],
                        Next: 'foo'
                    }
                ],
                Default: 'bar'
            });
        });

        it('should generate complex nested logic state choice operation', () => {
            const handleFoo = (new Task('foo')).setResource('xy').next.end();
            const handleBar = (new Task('bar')).setResource('xy').next.end();

            const state = (new Choice('isFoo'));
            const andOperation = state.createLogicRule(CHOICE_LOGIC_RULE.AND);


            andOperation.createComparatorRule(CHOICE_COMPARATOR_RULE.STRING_EQUALS)
                .setVariable('$.type')
                .setValue('foo')

            andOperation.createLogicRule(CHOICE_LOGIC_RULE.NOT)
                .createComparatorRule(CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .setVariable('$.test')
                .setValue(false);

            andOperation.next.to(handleFoo);
            state.defaultTo(handleBar);

            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Choice',
                Choices: [
                    {
                        And: [
                            {
                                Variable: '$.type',
                                StringEquals: 'foo'
                            },
                            {
                                Not: {
                                    Variable: "$.test",
                                    BooleanEquals: false
                                }
                            }
                        ],
                        Next: 'foo'
                    }
                ],
                Default: 'bar'
            });
        });

        it('should generate wait state', () => {
            const wait = new Wait('test');
            wait.for(10).next.end();

            const data = generator.generateState(wait);
            expect(data).to.deep.equal({
                Type: 'Wait',
                Seconds: 10,
                End: true,
            });
        });

        it('should generate succeed state', () => {
            const state = new Succeed('test');
            const data = generator.generateState(state);
            expect(data).to.deep.equal({ Type: 'Succeed' });
        });

        it('should generate fail state', () => {
            const state = new Fail('test');
            state.with(new Error('test'));

            const data = generator.generateState(state);

            expect(data).to.deep.equal({
                Type: 'Fail',
                Error: 'Error',
                Cause: 'test'
            });
        });
    });

    describe('generateStateMachine', () => {
        let generator: StepFunctionsGenerator;
        let fooState: State;
        let barState: State;
        let stateMachine: StateMachine;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
            barState = (new Pass('bar'))
                .path.setOutput('$.out')
                .next.end();
            fooState = (new Pass('foo'))
                .path.setInput('$.test')
                .path.setOutput('$.test2')
                .next.to(barState);

            stateMachine = (new StateMachine())
                .addState(fooState)
                .addState(barState);
        });

        it('should generate field next', () => {
            const data = generator.generateStateMachine(stateMachine);
            expect(data).to.deep.equal({
                StartAt: 'foo',
                States: {
                    foo: {
                        Next: 'bar',
                        InputPath: '$.test',
                        OutputPath: '$.test2',
                        Type: "Pass"
                    },
                    bar: {
                        End: true,
                        OutputPath: "$.out",
                        Type: "Pass"
                    }
                }
            });
        });
    })
});