import { expect } from 'chai';
import { StateMachine } from '../src/StateMachine';
import { Pass, State } from '../src/states';
import { statesAutolink } from '../src/helpers';

describe('Helpers', () => {

    let machine: StateMachine;
    let state: Pass;
    let builder: any;
    beforeEach(() => {
        machine = new StateMachine();
        state = (new Pass('foo'))
    });
});