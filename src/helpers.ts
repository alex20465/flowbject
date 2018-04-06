import { StateMachine } from "./StateMachine";
import { NextField } from './fields/NextField';

export function statesAutolink(stateMachine: StateMachine) {
    let previousState: any;
    stateMachine.getStates().forEach((state) => {
        if (previousState) {
            const next = <NextField<any>>(<any>previousState).next;
            if (next && !next.isConfigured()) {
                next.set(state);
            }
        }
        previousState = state;
    });

    if (previousState) {
        const next = <NextField<any>>(previousState).next;
        if (next && !next.isConfigured()) {
            next.setEnd();
        }
    }
}