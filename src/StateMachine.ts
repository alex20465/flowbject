import { State } from "./states";
import { NextField } from "./fields";
import { StateList } from "./states/State";

export interface StateMachineOptions {
    comment?: string
    timeout?: number // seconds
    version?: string
    /**
     * Link states directly after adding them with the
     * previous and the next.
     */
    autoLink?: boolean;
}

export class StateMachine {
    private comment: string | null;
    private timeout: number | null;
    private version: string | null;
    public states: StateList;
    private autoLink: boolean;

    constructor(options: StateMachineOptions = {}) {
        this.states = new StateList({
            autoLink: options.autoLink
        });
        this.comment = options.comment || null;
        this.timeout = options.timeout || null;
        this.version = options.version || null;
        this.autoLink = options.autoLink || false;
    }

    validate(): Error[] {
        let errors: Error[] = [];
        const states = this.states.getAll();
        errors = states.reduce((errors, state) => {
            return errors.concat(state.validate());
        }, errors);
        const machineErrors = [];
        if (states.length === 0) {
            machineErrors.push(new Error('State requires at least 1 state item'));
        }
        return errors.concat(machineErrors);
    }

    getComment() {
        return this.comment;
    }
    getTimeout() {
        return this.timeout;
    }
    getVersion() {
        return this.version;
    }
    setComment(comment: string) {
        this.comment = comment;
    }
    setTimeout(timeout: number) {
        this.timeout = timeout;
    }
    setVersion(version: string) {
        this.version = version;
    }
}