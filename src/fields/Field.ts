import { State } from "../states/State";


export abstract class Field<T extends State> {
    private state: T;

    private configured: boolean;

    abstract required: boolean;

    constructor(state: T) {
        this.state = state;
        this.configured = false;
    }


    getParentState(): T {
        return this.state;
    }

    validate(): null | Error {

        if (this.required && this.isConfigured() === false) {
            return new Error(`The field ${this.constructor.name} requires configuration setup!`);
        } else {
            return null;
        }
    }

    isConfigured(): boolean {
        return this.configured;
    };

    receiveConfiguration() {
        this.configured = true;
        return this.state;
    }
}