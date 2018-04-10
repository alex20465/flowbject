import { expect } from 'chai';
import { StateMachine } from '../src/StateMachine';
import { Pass, State } from '../src/states';
import { toASCII } from 'punycode';

describe('State Machine', () => {

    let machine: StateMachine;
    let state: Pass;

    beforeEach(() => {
        machine = new StateMachine();
        state = (new Pass('foo')).next.end();
    });

    describe('validation', () => {
        it('should contain validation "requires at least 1 state item"', () => {
            const errors = machine.validate();
            expect(errors).lengthOf(1);
            expect(errors[0].message).to.contain('requires at least 1 state item');
        });

        it('should respond without errors after adding a state', () => {
            machine.states.add(state);
            const errors = machine.validate();
            expect(errors).lengthOf(0);
        });
    });

    describe('getState', () => {
        beforeEach(() => {
            machine.states.add(state);
        });
        it('should respond with the Pass=foo instance', () => {
            expect(machine.states.get('foo')).to.be.equal(state);
        });
    });

    describe('Core functionality', () => {
        let machine: StateMachine;
        beforeEach(() => {
            machine = new StateMachine({
                comment: 'test Comment',
                timeout: 5000,
                version: '1.0'
            });
        });

        it('should provide comment', () => {
            expect(machine.getComment()).to.be.equal('test Comment');
        });
        it('should provide timeout', () => {
            expect(machine.getTimeout()).to.be.equal(5000);
        });
        it('should provide version', () => {
            expect(machine.getVersion()).to.be.equal('1.0');
        });
    });

    describe('autoLink enabled', () => {
        let secondState: Pass;
        beforeEach(() => {
            machine = new StateMachine({
                autoLink: true
            });
            state = (new Pass('foo'));
            secondState = new Pass('bar');
        });

            it('should link states automatically', () => {
                machine.states.add(state).add(secondState);
                expect(state.next.get()).to.be.equal(secondState.getName());
                expect(secondState.next.isEnd()).to.be.true;
                const errors = machine.validate();
                expect(errors).lengthOf(0);
            });
    });
});