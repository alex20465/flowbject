
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
            state.next.end();
            const errors = state.validate();
            expect(errors).lengthOf(0);
        });

        it('should be invalid without branch states', () => {
            state.addBranch();
            state.addBranch().addState(deleteRecord);
            state.next.end();
            const errors = state.validate();
            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('branch does not contain any start-at');
        });

        it('should provide all encapsulated instance (branches, states)', () => {
            state.addBranch().addState(notifyUser);
            state.addBranch().addState(deleteRecord);
            state.next.end();
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

    describe('Choice', () => {
        let state: states.Choice;
        let fooTask: states.Task;
        beforeEach(() => {
            state = new states.Choice("TestState");
            fooTask = new states.Task("fooTask").setResource('XY');
        });

        it('should add root boolean-equals operation', () => {
            state
                .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .variable('$.test')
                .equals(true);
        });

        it('should add root AND logical operation', () => {
            const rootOperation = state
                .logic(states.CHOICE_LOGIC_RULE.AND);
            const nestedOperation = rootOperation
                .compare(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS);

            expect(rootOperation.next).to.not.be.null;
            expect(nestedOperation.next).to.be.null; // nested operations have not next field
        });

        it('should add multiple nested operations', () => {
            const rootOperation = state
                .logic(states.CHOICE_LOGIC_RULE.AND)
            rootOperation.next.end();

            const operationDepth1 = rootOperation
                .logic(states.CHOICE_LOGIC_RULE.OR);

            const operationDepth2 = operationDepth1
                .compare(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS)
                .variable('$.test')
                .equals(22);

            const operationDepth2_2 = operationDepth1
                .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .variable('$.test2')
                .equals(false);

            rootOperation
                .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                .variable('$.isAccepted')
                .equals(true);

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
                    .logic(states.CHOICE_LOGIC_RULE.AND);
                const [error] = rootOperation.validate();
                expect(error.message).to.contain('require at least TWO nested operations');
            });
            it('should validate without errors with correct configrations', () => {
                const rootOperation = state
                    .logic(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.end();

                rootOperation
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .variable('$.isAvailable')
                    .equals(true);

                rootOperation
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .variable('$.isAccepted')
                    .equals(true);
                const errors = state.validate();
                expect(errors).lengthOf(0);
            });

            it('should detect errors of nested operations (depth 1)', () => {
                const rootOperation = state
                    .logic(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.end();

                rootOperation
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .equals(true);

                rootOperation
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .variable('$.isAccepted')
                    .equals(true);
                const errors = state.validate();
                expect(errors).lengthOf(1);
                expect(errors[0].message).to.contain('Variable operand of comparator is required');
            });

            it('should throw error when trying to add invalid value type to comparator rule BOOLEAN_EQUALS', () => {
                const rootOperation = state
                    .logic(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.end();

                expect(() => {
                    rootOperation
                        .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                        .equals("invalid");
                }).throws(Error, 'does not support value type');
            });

            it('should detect errors of nested operations (depth 2)', () => {
                const rootOperation = state
                    .logic(states.CHOICE_LOGIC_RULE.AND)
                rootOperation.next.end();

                const operationDepth1 = rootOperation
                    .logic(states.CHOICE_LOGIC_RULE.OR);

                const operationDepth2 = operationDepth1
                    .compare(states.CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS)
                    .variable('$.test')
                    .equals(22);
                const operationDepth2_2 = operationDepth1
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .variable('$.test2')

                rootOperation
                    .compare(states.CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS)
                    .variable('$.isAccepted')
                    .equals(true);

                const errors = state.validate();

                expect(errors).lengthOf(1);
                expect(errors[0].message).to.contain('Value operand of comparator is required');
            });
        });
    });
});