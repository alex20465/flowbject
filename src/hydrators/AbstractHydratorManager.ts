import { State } from "../states/State";
import { Field } from "../fields/Field";
import { StateMachine } from "../StateMachine";



export abstract class AbstractHydratorManager {

    abstract extractState(state: State): any;
    abstract extractField(field: Field<any>): any;
    abstract extractStateMachine(stateMachine: StateMachine): any;

    abstract hydrateState(name: string, data: any): State;
    abstract hydrateField(field: Field<any>, data: any): Field<any>;
    abstract hydrateStateMachine(stateMachine: StateMachine, data: any): StateMachine;

}