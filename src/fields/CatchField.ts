import { Field } from "./Field";
import { State } from "../states/State";
import { NextField } from './NextField';
import { ResultPathField } from './ResultPathField';

export class ErrorCacher<T extends State> {
    required = true;
    public next: NextField<T>;
    public resultPath: ResultPathField<T>;
    private errors: string[];
    private parent: T;
    constructor(state: T) {
        this.next = new NextField(state);
        this.resultPath = new ResultPathField(state);
        this.errors = [];
        this.parent = state;
    }

    setErrors(errors: string[]) {
        this.errors = errors;
        return this.parent;
    }

    getErrors() {
        return this.errors.splice(0);
    }

    validate() {
        const nextError = this.next.validate();
        const resultError = this.resultPath.validate();
        if (this.errors.length && nextError) {
            return nextError;
        }
        return resultError;
    }

}

export class CatchField<T extends State> extends Field<T> {
    required = false;
    private catchers: ErrorCacher<T>[];
    constructor(state: T) {
        super(state);
        this.catchers = [];
    }
    errors(errors: string[]): ErrorCacher<T> {
        const catcher = new ErrorCacher<T>(this.getParentState());
        catcher.setErrors(errors);
        this.receiveConfiguration();
        this.catchers.push(catcher);
        return catcher;
    }
    getCatchers(): ErrorCacher<T>[] {
        return this.catchers.splice(0);
    }
    validate() {
        const error = super.validate();
        if (!error) {
            let catcherError = null;
            this.catchers.every((catcher) => {
                catcherError = catcher.validate();
                return catcherError === null;
            });
            if (catcherError) {
                return catcherError;
            }
        }
        return error;
    }
}