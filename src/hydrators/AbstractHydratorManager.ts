import { State } from "../states/State";
import { Field } from "../fields/Field";
import { StateMachine } from "../StateMachine";
import { EventEmitter2, ConstructorOptions } from "eventemitter2";

export interface HydratorManagerOptions {
    emitter?: ConstructorOptions
}

export abstract class AbstractHydratorManager {
    public emitter: EventEmitter2;

    constructor(options: HydratorManagerOptions = {}) {
        this.emitter = new EventEmitter2(options.emitter);
    }

    abstract extractState(state: State): any;
    abstract extractField(field: Field<any>): any;
    abstract extractStateMachine(stateMachine: StateMachine): any;

    abstract hydrateState(name: string, data: any): State;
    abstract hydrateField(field: Field<any>, data: any): Field<any>;
    abstract hydrateStateMachine(stateMachine: StateMachine, data: any): StateMachine;

}