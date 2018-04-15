import { Field } from "./Field";
import { State } from "../states/State";


export interface NextFieldOptions {
    endForbidden?: boolean
    locked?: boolean
}

export class NextField<T extends State> extends Field<T> {
    required = true;

    private nextStateName: string;
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

    isEnd() {
        this.assertUnlocked();
        return this._end;
    }

    set(target: State | string): T {
        this.assertUnlocked();
        if (target instanceof State) {
            this.nextStateName = target.getName();
        } else {
            this.nextStateName = target;
        }
        if(this.isEnd()) {
            this._end = false;
        }
        this.receiveConfiguration();
        return this.getParentState();
    }

    get() {
        return this.nextStateName;
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