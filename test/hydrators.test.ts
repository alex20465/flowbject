import { expect } from 'chai';
import * as states from '../src/states';
import * as fields from '../src/fields';
import * as hydrators from '../src/hydrators/aws';
import { ERROR_CODES } from '../src/fields/RetryField';

describe.only('AWS', () => {
    let state: states.State;

    beforeEach(() => {
        state = new states.Pass('foo');
    })

    describe('NextField', () => {

        let field: fields.NextField<any>;
        let hydrator: hydrators.NextFieldHydrator;

        beforeEach(() => {
            field = new fields.NextField<any>(state);
            hydrator = new hydrators.NextFieldHydrator();
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
            hydrator = new hydrators.PathFieldHydrator();
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
            hydrator = new hydrators.ResultFieldHydrator();
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
            hydrator = new hydrators.RetryFieldHydrator();
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
            hydrator = new hydrators.CatchFieldHydrator();
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
            hydrator = new hydrators.ResultPathFieldHydrator();
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

});