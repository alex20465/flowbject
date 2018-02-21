
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
            const errors = state.validate();
            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('NextField requires configuration');
        });

        it('should contain no errors after [next] setup', () => {
            const errors = state.next.end().validate();
            expect(errors).lengthOf(0);
        });
    });

    describe('Task', () => {
        let state: states.Task;
        beforeEach(() => {
            state = new states.Task("TestState");
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

        it('should require resource definition', () => {
            const errors = state.validate();
            const errorMessages = errors.join('');
            expect(errorMessages).to.contain('"resource" is not required')
        });

        it('should require NextField configuration', () => {
            const errors = state.validate();
            const errorMessages = errors.join('');
            expect(errorMessages).to.contain('field NextField requires configuration setup');
        });

        it('should be valid with nextField and resource setup', () => {
            const errors = state
                .next.end()
                .setResource('thisIsMyResource')
                .validate();
            expect(errors).lengthOf(0);
        });

        it('should provide defined resource reference', () => {
            const resourceReference = state.setResource('thisIsMyResource').getResource();
            expect(resourceReference).to.be.equal('thisIsMyResource');
        });
    });
});