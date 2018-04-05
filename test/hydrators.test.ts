import { expect } from 'chai';
import * as states from '../src/states';
import * as fields from '../src/fields';
import * as hydrators from '../src/hydrators/aws';
import { ERROR_CODES } from '../src/fields/RetryField';
import { AWSStepFunctionsHydratorManager } from '../src/hydrators';

describe.only('AWS', () => {
    let state: states.State;
    let manager: AWSStepFunctionsHydratorManager;
    beforeEach(() => {
        state = new states.Pass('foo');
        manager = new AWSStepFunctionsHydratorManager();
    })

    describe('NextField', () => {

        let field: fields.NextField<any>;
        let hydrator: hydrators.NextFieldHydrator;

        beforeEach(() => {
            field = new fields.NextField<any>(state);
            hydrator = new hydrators.NextFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract End=true', () => {
                field.end();
                expect(hydrator.extract(field)).to.deep.equal({
                    End: true
                });
            });
            it('should extract Next=xy', () => {
                field.to('xy');
                expect(hydrator.extract(field)).to.deep.equal({
                    Next: 'xy'
                });
            });
        });

        describe('hydrate', () => {
            it('should extract End=true', () => {
                hydrator.hydrate(field, { End: true });
                expect(field.isEnd()).to.be.true;
            });
            it('should extract Next=xy', () => {
                hydrator.hydrate(field, { Next: 'fire' });
                expect(field.nextStateName()).to.be.equal('fire');
            });
        })
    });

    describe('PathField', () => {

        let field: fields.PathField<any>;
        let hydrator: hydrators.PathFieldHydrator;

        beforeEach(() => {
            field = new fields.PathField<any>(state);
            hydrator = new hydrators.PathFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract InputPath="$.test"', () => {
                field.setInput('$.test');
                expect(hydrator.extract(field)).to.deep.equal({
                    InputPath: '$.test'
                });
            });
            it('should extract OutputPath="$.test"', () => {
                field.setOutput('$.test');
                expect(hydrator.extract(field)).to.deep.equal({
                    OutputPath: '$.test'
                });
            });
        });

        describe('hydrate', () => {
            it('should extract InputPath="$.test"', () => {
                hydrator.hydrate(field, { InputPath: "$.test" });
                expect(field.getInput()).to.be.equal("$.test");
            });
            it('should extract OutputPath="$.test"', () => {
                hydrator.hydrate(field, { OutputPath: '$.test' });
                expect(field.getOutput()).to.be.equal("$.test");
            });
        })
    });

    describe('ResultField', () => {

        let field: fields.ResultField<any>;
        let hydrator: hydrators.ResultFieldHydrator;

        beforeEach(() => {
            field = new fields.ResultField<any>(state);
            hydrator = new hydrators.ResultFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract Result="$.test"', () => {
                field.set('$.test');
                expect(hydrator.extract(field)).to.deep.equal({
                    Result: '$.test'
                });
            });
        });

        describe('hydrate', () => {
            it('should extract Result="$.test"', () => {
                hydrator.hydrate(field, { Result: "$.test" });
                expect(field.get()).to.be.equal("$.test");
            });
        })
    });

    describe('RetryField', () => {

        let field: fields.RetryField<any>;
        let hydrator: hydrators.RetryFieldHydrator;

        beforeEach(() => {
            field = new fields.RetryField<any>(state);
            hydrator = new hydrators.RetryFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract catcher with maxAttempts', () => {
                const retrier = field.all();
                retrier.setMaxAttempts(1);
                retrier.setBackoffRate(2);
                retrier.setInterval(3);
                expect(hydrator.extract(field)).to.deep.equal({
                    Retry: [
                        {
                            ErrorEquals: ['States.ALL'],
                            MaxAttempts: 1,
                            BackoffRate: 2,
                            IntervalSeconds: 3,
                        }
                    ]
                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate all state retrier', () => {
                hydrator.hydrate(field, {
                    Retry: [
                        {
                            ErrorEquals: ['States.ALL'],
                            MaxAttempts: 1,
                            BackoffRate: 2,
                            IntervalSeconds: 3,
                        },
                        {
                            ErrorEquals: ['States.BranchFailed', 'States.Permissions'],
                            BackoffRate: 2,
                            IntervalSeconds: 3,
                        },
                    ]
                });

                expect(field.getRetries()).lengthOf(2);
                const [allRetrier, branchRetrier] = field.getRetries();

                expect(allRetrier.getErrorTypes()).to.deep.equal([
                    ERROR_CODES.ALL
                ]);
                expect(allRetrier.getMaxAttempts()).to.be.equal(1);
                expect(allRetrier.getBackoffRate()).to.be.equal(2);
                expect(allRetrier.getInterval()).to.be.equal(3);

                expect(branchRetrier.getErrorTypes()).to.deep.equal([
                    ERROR_CODES.BRANCH_FAILED,
                    ERROR_CODES.PERMISSIONS
                ]);
                expect(branchRetrier.getBackoffRate()).to.be.equal(2);
                expect(branchRetrier.getInterval()).to.be.equal(3);

            });
        })
    });

    describe('CatchField', () => {

        let field: fields.CatchField<any>;
        let hydrator: hydrators.CatchFieldHydrator;

        beforeEach(() => {
            field = new fields.CatchField<any>(state);
            hydrator = new hydrators.CatchFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract catcher with maxAttempts', () => {
                const catcher = field.errors(['NotFoundError']);
                catcher.next.end();
                catcher.resultPath.set('$.foo')
                expect(hydrator.extract(field)).to.deep.equal({
                    Catch: [
                        {
                            ErrorEquals: ['NotFoundError'],
                            End: true,
                            ResultPath: '$.foo'
                        }
                    ]
                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate all state retrier', () => {
                hydrator.hydrate(field, {
                    Catch: [
                        {
                            ErrorEquals: ['NotFoundError'],
                            Next: "test",
                            ResultPath: "$.bar"
                        },
                        {
                            ErrorEquals: ['TimeoutError'],
                            End: true
                        },
                    ]
                });
                const [notFoundCatcher, timeoutCatcher] = field.getCatchers();

                expect(notFoundCatcher).not.to.be.undefined;
                expect(timeoutCatcher).not.to.be.undefined;
                expect(notFoundCatcher.next.nextStateName()).to.be.equal('test');
                expect(notFoundCatcher.resultPath.get()).to.be.equal('$.bar');
                expect(timeoutCatcher.next.isEnd()).to.be.true;
            });
        })
    });

    describe('ResultPathField', () => {

        let field: fields.ResultPathField<any>;
        let hydrator: hydrators.ResultPathFieldHydrator;

        beforeEach(() => {
            field = new fields.ResultPathField<any>(state);
            hydrator = new hydrators.ResultPathFieldHydrator(manager);
        });

        describe('extract', () => {
            it('should extract resultPath NULL to discard the results', () => {
                field.discard();
                const data = hydrator.extract(field);

                expect(data).to.deep.equal({
                    ResultPath: null
                });
            });

            it('should extract exact jsonpath-pattern', () => {
                field.set('$.foo');
                const data = hydrator.extract(field);
                expect(data).to.deep.equal({
                    ResultPath: '$.foo'
                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate all null as discard', () => {
                hydrator.hydrate(field, {
                    ResultPath: null
                });
                expect(field.get()).to.be.null;
            });
            it('should hydrate specific JSONPath pattern', () => {
                hydrator.hydrate(field, {
                    ResultPath: '$.foo'
                });
                expect(field.get()).to.be.equal('$.foo');
            });
        });
    });

    describe('WaitState', () => {

        let state: states.Wait;
        let hydrator: hydrators.WaitStateHydrator;

        beforeEach(() => {
            state = new states.Wait('foo');
            hydrator = new hydrators.WaitStateHydrator(manager);
        });

        describe('extract seconds', () => {
            it('should extract', () => {
                state.setSeconds(6);
                expect(hydrator.extract(state)).to.deep.equal({
                    Seconds: 6
                });
            });
        });

        describe('hydrate seconds', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {
                    Seconds: 7
                });
                expect(state.getSeconds()).to.be.equal(7);
            });
        });
    });

    describe('TaskState', () => {

        let state: states.Task;
        let hydrator: hydrators.TaskStateHydrator;

        beforeEach(() => {
            state = new states.Task('foo');
            hydrator = new hydrators.TaskStateHydrator(manager);
        });

        describe('extract', () => {
            it('should extract', () => {
                state.setResource('xy')
                    .setTimeout(7)
                    .setHeartbeat(1);
                expect(hydrator.extract(state)).to.deep.equal({
                    Resource: 'xy',
                    TimeoutSeconds: 7,
                    HeartbeatSeconds: 1
                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {
                    Resource: 'xy',
                    TimeoutSeconds: 7,
                    HeartbeatSeconds: 1
                });
                expect(state.getResource()).to.be.equal('xy');
                expect(state.getTimeout()).to.be.equal(7);
                expect(state.getHeartbeat()).to.be.equal(1);
            });
        });
    });

    describe('SucceedState', () => {

        let state: states.Succeed;
        let hydrator: hydrators.SucceedStateHydrator;

        beforeEach(() => {
            state = new states.Succeed('foo');
            hydrator = new hydrators.SucceedStateHydrator(manager);
        });

        describe('extract', () => {
            it('should extract', () => {
                expect(hydrator.extract(state)).to.deep.equal({});
            });
        });

        describe('hydrate', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {});
                expect(null).to.be.null;
            });
        });
    });

    describe('ParallelState', () => {

        let state: states.Parallel;
        let hydrator: hydrators.ParallelStateHydrator;

        beforeEach(() => {
            state = new states.Parallel('foo');
            hydrator = new hydrators.ParallelStateHydrator(manager);
        });

        describe('extract', () => {
            it('should extract', () => {
                const subTask = new states.Task('foo').setResource('xy');
                state.addBranch().addState(subTask);
                expect(hydrator.extract(state)).to.deep.equal({
                    Branches: [
                        {
                            StartAt: 'foo',
                            States: {
                                foo: {
                                    Type: 'Task',
                                    Resource: 'xy'
                                }
                            }
                        }
                    ]
                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {
                    Branches: [
                        {
                            StartAt: 'foo',
                            States: {
                                foo: {
                                    Type: 'Task',
                                    Resource: 'xy'
                                }
                            }
                        }
                    ]
                });
                const [branch] = state.getBranches();

                expect(branch.getStartAt().getName()).to.be.equal('foo');
                const [fooState] = branch.getStates();
                expect((<states.Task>fooState).getResource()).to.be.equal('xy');
            });
        });
    });

    describe('FailState', () => {

        let state: states.Fail;
        let hydrator: hydrators.FailStateHydrator;

        beforeEach(() => {
            state = new states.Fail('foo');
            hydrator = new hydrators.FailStateHydrator(manager);
        });

        describe('extract', () => {
            it('should extract', () => {
                expect(hydrator.extract(state)).to.deep.equal({

                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {});
                expect(null).to.be.null;
            });
        });
    });

    describe('ChoiceState', () => {

        let state: states.Choice;
        let hydrator: hydrators.ChoiceStateHydrator;

        beforeEach(() => {
            state = new states.Choice('foo');
            hydrator = new hydrators.ChoiceStateHydrator(manager);
        });

        describe('extract', () => {
            it('should extract', () => {
                expect(hydrator.extract(state)).to.deep.equal({

                });
            });
        });

        describe('hydrate', () => {
            it('should hydrate', () => {
                hydrator.hydrate(state, {});
                expect(null).to.be.null;
            });
        });
    });
});