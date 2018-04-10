import { State } from "./states/State";
import { NextField } from './fields/NextField';

const JPATH_VALIDATOR_EXPRESSION = /^\$/;

export function validateJSONPath(path: string): null | Error {
    if (JPATH_VALIDATOR_EXPRESSION.test(path)) {
        return null;
    } else {
        return new Error(`Invalid json-path expression "${path}"`);
    }
}
