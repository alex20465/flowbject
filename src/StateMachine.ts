import { State } from "./states";

interface StateMachineOptions {
    comment?: string
    timeout?: number // seconds
    version?: string
}

export class StateMachine {
    private comment: string;
    private timeout: number;
    private version: string;
    private startState: State;
    private states: State[];
    private _state_index: { [k: string]: number }

    constructor(options: StateMachineOptions = {}) {
        this.states = [];

        this.comment = options.comment || null;
        this.timeout = options.timeout || null;
        this.version = options.version || null;
        this.startState = null;
        this._state_index = {};
    }
    startAt(state: State): this {
        // @todo: State should exists in the states
        this.startState = state;
        return this;
    }

    private indexState(state: State, index: number) {
        if (this._state_index[state.getName()]) {
            throw new Error(`State ${state.getName()} already indexed.`);
        } else {
            this._state_index[state.getName()] = index;
        }
    }

    addState(state: State): this {
        const index = this.states.push(state);
        this.indexState(state, index);
        if (this.startState === null) {
            this.startAt(state);
        }
        return this;
    }

    validate(): Error[] {
        const stateErrors = this.states.reduce((errors, state) => {
            return errors.concat(state.validateFields());
        }, []);
        const machineErrors = [];
        if (this.states.length === 0) {
            machineErrors.push(new Error('State requires at least 1 state item'));
        }
        return stateErrors.concat(machineErrors);
    }

    dump(): Object {
        const dump = {
            StartAt: this.startState.getName(),
            States: {}
        };

        if (this.getComment()) {
            dump['Comment'] = this.getComment();
        }

        if (this.getTimeout()) {
            dump['TimeoutSeconds'] = this.getTimeout();
        }

        if (this.getVersion()) {
            dump['Version'] = this.getVersion();
        }

        dump.States = this.states.reduce((states, state) => {
            states[state.getName()] = state.dump();
            return states;
        }, {});

        return dump;
    }

    getComment() { return this.comment }
    getTimeout() { return this.timeout }
    getVersion() { return this.version }
}