
import { expect } from 'chai';
import * as states from '../src/states';
import * as fields from '../src/fields';

describe('States', () => {
    describe('Pass', () => {
        let state: states.Pass;
        beforeEach(() => {
            state = new states.Pass("TestState");
        });
        it('should provide instance of ResultPathField', () => {
            expect(state.resultPath).to.be.instanceof(fields.ResultPathField);
        });
        it('should provide instance of PathField', () => {
            expect(state.path).to.be.instanceof(fields.PathField);
        });
        it('should provide instance of ResultField', () => {
            expect(state.result).to.be.instanceof(fields.ResultField);
        });
        it('should provide instance of NextField', () => {
            expect(state.next).to.be.instanceof(fields.NextField);
        });
        it('should provide name "TestState"', () => {
            expect(state.getName()).to.be.equal('TestState');
        });

        it('should list field validation errors', () => {
            const errors = state.validateFields();
            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('NextField requires configuration');
        });

        it('should contain no errors after [next] setup', () => {
            const errors = state.next.end().validateFields();
            expect(errors).lengthOf(0);
        });
    });
});