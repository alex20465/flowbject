import { State } from "../states/State";


export abstract class Field<T extends State> {
    private state: T;
    private configured: boolean;
    abstract required: boolean;

    constructor(state: T) {
        this.state = state;
        this.configured = false;
    }

    /**
     * We store and provide the state to allow method chaining. 
     */
    getParentState(): T {
        return this.state;
    }

    /**
     * Dump all field properties to an object.
     */
    abstract dump(): any;

    /**
     * Load field data from an object.
     */
    abstract load(obj: any): T;

    /**
     * Method to validate some data, optional implementation. 
     */
    validate(): null | Error {

        if (this.required && this.isConfigured() === false) {
            return new Error(`The field ${this.constructor.name} requires configuration setup!`);
        } else {
            return null;
        }
    }

    /**
     * When the field should be used as configuration to the parent (State).
     * If false the field is not configured, this means the State will
     * not provide any configuration of this field.
     */
    isConfigured(): boolean {
        return this.configured;
    };

    /**
     * Once the instance receives configurations, we change the field
     * as configured. Call this once the field received setup interactions.
     */
    receiveConfiguration() {
        this.configured = true;
        return this.state;
    }
}