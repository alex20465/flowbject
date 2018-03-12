import { State } from './State';
import { NextField } from '../fields';

export class Fail extends State {
    private error: Error;

    with(error: Error) {
        this.error = error;
        return this;
    }

    getErrorType() {
        return this.error.name || this.error.constructor.name;
    }

    getErrorMessage() {
        return this.error.message;
    }

    validate() {
        const errors: Error[] = super.validate();
        if (!this.error) {
            errors.push(new Error('Fail state requires an error'));
        }
        return errors;
    }
}