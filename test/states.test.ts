
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
            const errors = state.next.setEnd().validate();
            expect(errors).lengthOf(0);
        });
    });

    describe('Parallel', () => {
        let state: states.Parallel;
        let notifyUser: states.Task;
        let deleteRecord: states.Task;

        beforeEach(() => {
            state = new states.Parallel("TestState");
            notifyUser = new states.Task('notifyUser');
            deleteRecord = new states.Task('deleteRecord');
        });

        it('should be a valid parallel state', () => {
            state.addBranch().addState(notifyUser);
            state.addBranch().addState(deleteRecord);
            state.next.setEnd();
            const errors = state.validate();
            expect(errors).lengthOf(0);
        });

        it('should be invalid without branch states', () => {
            state.addBranch();
            state.addBranch().addState(deleteRecord);
            state.next.setEnd();
            const errors = state.validate();
            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('branch does not contain any start-at');
        });

        it('should provide all encapsulated instance (branches, states)', () => {
            state.addBranch().addState(notifyUser);
            state.addBranch().addState(deleteRecord);
            state.next.setEnd();
            const branches = state.getBranches();

            expect(branches).lengthOf(2);
            const [notifyUserBranch, deleteRecordBranch] = branches;

            expect(notifyUserBranch.getStates()).lengthOf(1);
            expect(deleteRecordBranch.getStates()).lengthOf(1);
            expect(notifyUserBranch.getStates()).lengthOf(1);
            expect(deleteRecordBranch.getStates()).lengthOf(1);

            expect(notifyUserBranch.getStartAt()).to.be.equal(notifyUser);
            expect(deleteRecordBranch.getStartAt()).to.be.equal(deleteRecord);

            const [notifyUserState] = notifyUserBranch.getStates();
            const [deleteRecordState] = deleteRecordBranch.getStates();

            expect(deleteRecordState.getName()).to.be.equal('deleteRecord');
            expect(notifyUserState.getName()).to.be.equal('notifyUser');
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
                .next.setEnd()
                .setResource('thisIsMyResource')
                .validate();
            expect(errors).lengthOf(0);
        });

        it('should provide defined resource reference', () => {
            const resourceReference = state.setResource('thisIsMyResource').getResource();
            expect(resourceReference).to.be.equal('thisIsMyResource');
        });
    });

    describe('Choice', () => {
        let state: states.Choice;
        let fooTask: states.Task;
        beforeEach(() => {
            state = new states.Choice("TestState");
            fooTask = new states.Task("fooTask").setResource('XY');
        });

        it('should add root boolean-equals operation', () => {
            state
                .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .setVariable('$.test')
                .setValue(true);
        });

        it('should add root AND logical operation', () => {
            const rootOperation = state
                .createLogicRule(states.CHOICE_LOGIC_RULE.AND);
            const nestedOperation = rootOperation
                .createComparatorRule(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS);

            expect(nestedOperation.next.isLocked()).to.be.true;
        });

        it('should add multiple nested operations', () => {
            const rootOperation = state
                .createLogicRule(states.CHOICE_LOGIC_RULE.AND)
            rootOperation.next.setEnd();

            const operationDepth1 = rootOperation
                .createLogicRule(states.CHOICE_LOGIC_RULE.OR);

            const operationDepth2 = operationDepth1
                .createComparatorRule(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS)
                .setVariable('$.test')
                .setValue(22);

            const operationDepth2_2 = operationDepth1
                .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .setVariable('$.test2')
                .setValue(false);

            rootOperation
                .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .setVariable('$.isAccepted')
                .setValue(true);

            const errors = state.validate();
            expect(errors).lengthOf(0);
        });

        describe('validation', () => {
            it('should validate with errors when no root operations are added', () => {
                const [error] = state.validate();
                expect(error.message).to.contain('requires at least ONE operation');
            })
            it('should validate with errors with no operations are added', () => {
                const rootOperation = state
                    .createLogicRule(states.CHOICE_LOGIC_RULE.AND);
                const [error] = rootOperation.validate();
                expect(error.message).to.contain('require at least TWO nested operations');
            });
            it('should validate without errors with correct configrations', () => {
                const rootOperation = state
                    .createLogicRule(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.setEnd();

                rootOperation
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setVariable('$.isAvailable')
                    .setValue(true);

                rootOperation
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setVariable('$.isAccepted')
                    .setValue(true);
                const errors = state.validate();
                expect(errors).lengthOf(0);
            });

            it('should detect errors of nested operations (depth 1)', () => {
                const rootOperation = state
                    .createLogicRule(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.setEnd();

                rootOperation
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setValue(true);

                rootOperation
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setVariable('$.isAccepted')
                    .setValue(true);
                const errors = state.validate();
                expect(errors).lengthOf(1);
                expect(errors[0].message).to.contain('Variable operand of comparator is required');
            });

            it('should throw error when trying to add invalid value type to comparator rule BOOLEAN_EQUALS', () => {
                const rootOperation = state
                    .createLogicRule(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.setEnd();

                expect(() => {
                    rootOperation
                        .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                        .setValue("invalid");
                }).throws(Error, 'does not support value type');
            });

            it('should detect errors of nested operations (depth 2)', () => {
                const rootOperation = state
                    .createLogicRule(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.setEnd();

                const operationDepth1 = rootOperation
                    .createLogicRule(states.CHOICE_LOGIC_RULE.OR);

                const operationDepth2 = operationDepth1
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS)
                    .setVariable('$.test')
                    .setValue(22);
                const operationDepth2_2 = operationDepth1
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setVariable('$.test2')

                rootOperation
                    .createComparatorRule(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .setVariable('$.isAccepted')
                    .setValue(true);

                const errors = state.validate();

                expect(errors).lengthOf(1);
                expect(errors[0].message).to.contain('Value operand of comparator is required');
            });
        });
    });

    describe('Wait', () => {
        let state: states.Wait;

        beforeEach(() => {
            state = new states.Wait('waitFor');
        });

        it('should set seconds', () => {
            state.for(10);
            expect(state.getSeconds()).to.be.equal(10);
        });

        it('should throw error when trying to set negative number as seconds', () => {
            expect(() => {
                state.for(-10);
            }).to.throw(Error, 'Seconds can not be negative');
        });

        it('should respond with validation error when wait-seconds are not defined', () => {
            const errors = state.next.setEnd().validate();

            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('state requires "seconds" definition');
        });
    });

    describe('Fail', () => {
        let fail: states.Fail;

        beforeEach(() => {
            fail = new states.Fail('failState');
        });

        it('should get correct error type and message', () => {
            const error = new Error('error message xy');
            error.name = 'TestError';
            fail.with(error);
            expect(fail.getErrorType()).to.be.equal('TestError');
            expect(fail.getErrorMessage()).to.be.equal('error message xy');
        });
    });


});