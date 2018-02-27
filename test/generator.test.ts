import { expect } from 'chai';
import { StepFunctionsGenerator } from '../src/generators/StepFunctionsGenerator';
import { StateMachine } from '../src/StateMachine';
import { State, Pass, Task, Parallel } from '../src/states';

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
            notFoundCatcher.next.toState(stateNotFoundTask);

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
            notFoundCatcher.next.toState(stateNotFoundTask);

            // setup fatal error catcher
            const fatalErrorCatcher = state.catch.errors(['FatalError', 'ServerError']);
            fatalErrorCatcher.next.toState(fatalErrorTask);
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
                .next.toState(barState);

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