import { State } from "./states/State";
import { NextField } from './fields/NextField';

const JPATH_VALIDATOR_EXPRESSION = /^\$/;
/**
 * @todo: Test this and allow more valid json-paths
 */
export function validateJSONPath(path: string): null | Error {
    if(JPATH_VALIDATOR_EXPRESSION.test(path)) {
        return null;
    } else {
        return new Error(`Invalid json-path expression "${path}"`);
    }
}

export function linkStates(states: State[]) {
    let previousState: any;
    states.forEach((state) => {
        if (previousState) {
            const next = <NextField<any>>(<any>previousState).next;
            if (next && !next.isConfigured()) {
                next.to(state);
            }
        }
        previousState = state;
    });

    if (previousState) {
        const next = <NextField<any>>(previousState).next;
        if (next && !next.isConfigured()) {
            next.end();
        }
    }
}