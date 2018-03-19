import { Field } from "./Field";
import { State } from "../states/State";
import { validateJSONPath } from '../utils';

export class ResultPathField<T extends State> extends Field<T> {
    required: false;
    private path: string | null = null;

    private _discard: boolean = false;

    validate() {
        if (this.path !== null) {
            return validateJSONPath(this.path);
        } else {
            return null;
        }
    }

    discard() {
        this._discard = true;
        this.receiveConfiguration();
        return this.getParentState();
    }

    set(path: string): T {
        let err = validateJSONPath(path);
        if (err) {
            throw err;
        }
        this.receiveConfiguration();
        this.path = path
        return this.getParentState();
    }

    get() {
        if (this._discard) {
            return null;
        } else {
            return this.path;
        }
    }
}