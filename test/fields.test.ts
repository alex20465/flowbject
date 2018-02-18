import { expect } from 'chai';
import * as fields from '../src/fields';
import { Pass } from '../src/states';


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
            expect(resultField.getAll()).to.deep.equal({});
        });

        it('should set single result value', () => {
            resultField.set('test', 0);
            expect(resultField.getAll()).to.deep.equal({ test: 0 });
        });

        it('should change the configuration state to TRUE after calling SET()', () => {
            expect(resultField.isConfigured()).to.be.false;
            expect(resultField.set('test', 0).result.isConfigured()).to.be.true;
        })

        it('should set results using setResult chain', () => {
            resultField.set('test', 0).result.set('test2', 1);
            expect(resultField.getAll()).to.deep.equal({ test: 0, test2: 1 });
        })

        it('should get result test=0', () => {
            resultField.set('test', 0);
            expect(resultField.get('test')).to.be.equal(0);
        });

        it('should dump data', () => {
            const dump = resultField.set('test', 0).result.dump();
            expect(dump).to.deep.eq({ Result: { test: 0 } });
        });

        it('should load data', () => {
            const loadedResult = resultField.load({ Result: { 'test': 8 } }).result.getAll();
            expect(loadedResult).to.deep.eq({ test: 8 });
        });
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

        it('should dump End=true', () => {
            nextField.end();
            expect(nextField.dump()).to.deep.equal({ End: true });
        });

        it('should dump Next=foo', () => {
            nextField.toState('foo');
            expect(nextField.dump()).to.deep.equal({ Next: 'foo' });
        });

        it('should dump Next=foo (State instance)', () => {
            const state = new Pass('foo');
            nextField.toState(state);
            expect(nextField.dump()).to.deep.equal({ Next: 'foo' });
        });

        it('should load and dump END=true correctly', () => {
            const dump = nextField.load({End: true}).next.dump();
            expect(dump).to.deep.equal({End: true});
        });

        it('should load and dump Next=foo correctly', () => {
            const dump = nextField.load({Next: 'foo'}).next.dump();
            expect(dump).to.deep.equal({Next: 'foo'});
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

        it('should dump correctly with input', () =>{
            const dump = pathField.setInput('$.test').path.dump();
            expect(dump).to.deep.equal({
                InputPath: '$.test'
            });
        });

        it('should dump correctly with output', () =>{
            const dump = pathField.setOutput('$.test').path.dump();
            expect(dump).to.deep.equal({
                OutputPath: '$.test'
            });
        });
    });
})