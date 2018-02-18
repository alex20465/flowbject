import { Field } from "./Field";
import { State } from "../states/State";
import { validateJSONPath } from '../utils';
export class ResultPathField<T extends State> extends Field<T> {
    required: false;
    private path: string | null = null;


    validate() {
        if (this.path !== null) {
            return validateJSONPath(this.path);
        } else {
            return null;
        }
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
        return this.path;
    }

    dump() {
        return {
            ResultPath: this.get()
        }
    }

    load(obj: any): any {
        if (obj['ResultPath']) {
            this.set(obj['ResultPath']);
        }
    }
}