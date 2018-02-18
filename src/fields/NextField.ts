import { Field } from "./Field";
import { State } from "../states/State";

export class NextField<T extends State> extends Field<T> {
    required = true;

    private nextTargetName: string;
    private _end: boolean;

    dump() {
        if (this._end === true) {
            return { End: true };
        } else {
            return { Next: this.nextTargetName };
        }
    }

    toState(target: State | string): T {
        if (target instanceof State) {
            this.nextTargetName = target.getName();
        } else {
            this.nextTargetName = target;
        }
        this.receiveConfiguration();
        return this.getParentState();
    }

    end(): T {
        this._end = true;
        this.receiveConfiguration();
        return this.getParentState();
    }

    load(obj: any) {
        if (obj['End']) {
            this.end();
        } else if (obj['Next']) {
            this.toState(obj['Next']);
        } else {
            throw new Error('Failed to load required field "Next" of field dump: ' + JSON.stringify(obj));
        }
        return this.getParentState();
    }
}