import { expect } from 'chai';
import * as fields from '../src/fields';
import { Pass, Task } from '../src/states';
import { ERROR_CODES } from '../src/fields/RetryField';


function createTestState(): Pass {
    return new Pass('testState');
}

describe('Fields', () => {

    describe('ResultField', () => {
        let resultField: fields.ResultField<Pass>;
        beforeEach(() => {
            resultField = createTestState().result;
        });

        it('should provide empty result object by default', () => {
            expect(resultField.get()).to.deep.equal(null);
        });

        it('should set single result value', () => {
            resultField.set({ 'test': 0 });
            expect(resultField.get()).to.deep.equal({ test: 0 });
        });

        it('should change the configuration state to TRUE after calling SET()', () => {
            expect(resultField.isConfigured()).to.be.false;
            expect(resultField.set({ 'test': 0 }).result.isConfigured()).to.be.true;
        })
    });

    describe('NextField', () => {
        let nextField: fields.NextField<Pass>;
        beforeEach(() => {
            nextField = createTestState().next;
        });
        it('should not be vaild with default construction', () => {
            const validationResponse = nextField.validate();
            expect(validationResponse).to.be.instanceof(Error);
        });

        it('should be valid after END() call', () => {
            const validationResponse = nextField.end().next.validate();
            expect(validationResponse).to.be.null;
        });

        it('should be configured after END() call', () => {
            nextField.end();
            expect(nextField.isConfigured()).to.be.true;
        });
    });


    describe('ResultPathField', () => {
        let resultField: fields.ResultPathField<Pass>;
        beforeEach(() => {
            resultField = createTestState().resultPath;
        });

        it('should provide NULL as default result', () => {
            expect(resultField.get()).to.be.null;
        })
        it('should set valid path', () => {
            expect(resultField.set('$.test').resultPath.get()).to.be.equal('$.test');
        });

        it('should throw error with invalid JSONPath', () => {
            expect(function invalidJSONPathSetter() {
                resultField.set('-.test');
            }).throw(Error, 'Invalid json-path');
        });

        it('should change configured state after SET', () => {
            expect(resultField.isConfigured()).to.be.false;
            expect(resultField.set('$.test').resultPath.isConfigured()).to.be.true;
        });
    });
    describe('PathField', () => {
        let pathField: fields.PathField<Pass>;
        beforeEach(() => {
            pathField = createTestState().path;
        });


        describe('setInput', () => {
            it('should provide NULL as default result', () => {
                expect(pathField.getInput()).to.be.null;
            })

            it('should set valid input', () => {
                expect(pathField.setInput('$.test').path.getInput()).to.be.equal('$.test');
            });

            it('should throw error with invalid JSONPath', () => {
                expect(function invalidJSONPathSetter() {
                    pathField.setInput('-.test');
                }).throw(Error, 'Invalid json-path');
            });
            it('should change configured state after SET', () => {
                expect(pathField.isConfigured()).to.be.false;
                expect(pathField.setOutput('$.test').path.isConfigured()).to.be.true;
            });
        })

        describe('setOutput', () => {
            it('should provide NULL as default result', () => {
                expect(pathField.getOutput()).to.be.null;
            })

            it('should set valid Output', () => {
                expect(pathField.setOutput('$.test').path.getOutput()).to.be.equal('$.test');
            });

            it('should throw error with invalid JSONPath', () => {
                expect(function invalidJSONPathSetter() {
                    pathField.setOutput('-.test');
                }).throw(Error, 'Invalid json-path');
            });
            it('should change configured state after SET', () => {
                expect(pathField.isConfigured()).to.be.false;
                expect(pathField.setOutput('$.test').path.isConfigured()).to.be.true;
            });
        })

        it('should change configured state after SET', () => {
            expect(pathField.isConfigured()).to.be.false;
            expect(pathField.setInput('$.test').path.isConfigured()).to.be.true;
        });
    });

    describe('CatchField', () => {
        let field: fields.CatchField<Task>;
        let state: Task;
        beforeEach(() => {
            state = new Task('foo');
            field = new fields.CatchField(state);
        });

        it('should validate without error', () => {
            const mockReportState = new Task('report');
            const error = state.catch.validate();
            expect(error).to.be.null;
        });

        it('should validate with error: "requires configuration setup"', () => {
            const mockReportState = new Task('report');
            state.catch.errors(['test']); // requires next setup
            const error = state.catch.validate();
            expect(error).not.to.be.null;
            expect((<Error>error).message).to.contain('requires configuration setup');
        });

        it('should validate without error but with next setup', () => {
            const mockReportState = new Task('report');
            state.catch.errors(['test']).next.end();
            const error = state.catch.validate();
            expect(error).to.be.null;
        });
    });

    describe('RetryField', () => {
        let field: fields.RetryField<Task>;
        let state: Task;
        beforeEach(() => {
            state = new Task('foo');
            field = new fields.RetryField(state);
        });

        it('should validate without error', () => {
            const error = state.retry.validate();
            expect(error).to.be.null;
        });

        it('should create timeout retry', () => {
            const retrier = state.retry.timeout();
            expect(retrier.getErrorTypes()).to.deep.equal([ERROR_CODES.TIMEOUT]);
        });

        it('should receive configuration after timeout retry registration', () => {
            const retrier = state.retry.timeout();
            expect(state.retry.isConfigured()).to.be.equal(true);
        });
    });
})