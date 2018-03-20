import { expect } from 'chai';
import { StateMachine } from '../src/StateMachine';
import { Pass, State } from '../src/states';
import { statesAutolink } from '../src/helpers';

describe('Helpers', () => {

    let machine: StateMachine;
    let state: Pass;

    beforeEach(() => {
        machine = new StateMachine();
        state = (new Pass('foo'))
    });

    describe('statesAutolink', () => {
        it('should respond without errors after autolink the state', () => {
            machine.addState(state);
            statesAutolink(machine);
            const errors = machine.validate();
            expect(errors).lengthOf(0);
        });
    });
});