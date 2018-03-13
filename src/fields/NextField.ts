import { Field } from "./Field";
import { State } from "../states/State";


export interface NextFieldOptions {
    endForbidden?: boolean
    locked?: boolean
}

export class NextField<T extends State> extends Field<T> {
    required = true;

    private nextTargetName: string;

    private _end: boolean;
    private _endForbidden: boolean;
    private _isLocked: boolean;

    constructor(state: T, options: NextFieldOptions = {}) {
        super(state);
        if (options.endForbidden !== undefined) {
            this._endForbidden = options.endForbidden;
        }
        this._isLocked = options.locked || false;
    }

    isLocked() {
        return this._isLocked ? true : false;
    }

    to(target: State | string): T {
        this.assertUnlocked();
        if (target instanceof State) {
            this.nextTargetName = target.getName();
        } else {
            this.nextTargetName = target;
        }
        this.receiveConfiguration();
        return this.getParentState();
    }

    isEnd() {
        this.assertUnlocked();
        return this._end;
    }

    nextStateName() {
        return this.nextTargetName;
    }

    private assertUnlocked() {
        if (this._isLocked) {
            throw new Error(`Next field is currently locked, setup is not allowed.`);
        }
    }

    end(): T {
        if (this._endForbidden === true) {
            throw new Error(`next.End is forbidden to state ${this.getParentState().getName()}`);
        }
        this.assertUnlocked();
        this._end = true;
        this.receiveConfiguration();
        return this.getParentState();
    }

    validate() {
        if(this.isLocked()) {
            return null;
        }
        return super.validate();
    }
}