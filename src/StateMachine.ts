import { State } from "./states";
import { NextField } from "./fields";
import { linkStates } from "./utils";

export interface StateMachineOptions {
    comment?: string
    timeout?: number // seconds
    version?: string
}

export class StateMachine {
    private comment: string | null;
    private timeout: number | null;
    private version: string | null;
    private startAt: string | null;
    private states: State[];
    private _state_index: { [k: string]: number }

    constructor(options: StateMachineOptions = {}) {
        this.states = [];

        this.comment = options.comment || null;
        this.timeout = options.timeout || null;
        this.version = options.version || null;
        this.startAt = null;
        this._state_index = {};
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
        if (this.startAt === null) {
            this.setStartState(state.getName());
        }
        return this;
    }

    link(): void {
        linkStates(this.states);
    }

    validate(): Error[] {
        let errors: Error[] = [];
        errors = this.states.reduce((errors, state) => {
            return errors.concat(state.validate());
        }, errors);
        const machineErrors = [];
        if (this.states.length === 0) {
            machineErrors.push(new Error('State requires at least 1 state item'));
        }
        return errors.concat(machineErrors);
    }

    getComment() { return this.comment }
    getTimeout() { return this.timeout }
    getVersion() { return this.version }
    getStates() { return this.states.slice(0) }
    getStartState() { return this.startAt }

    setComment(comment: string) {
        this.comment = comment;
    }
    setTimeout(timeout: number) {
        this.timeout = timeout;
    }
    setVersion(version: string) {
        this.version = version;
    }
    setStartState(stateName: string) {
        this.startAt = stateName;
    }
}