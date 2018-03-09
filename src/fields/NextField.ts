import { Field } from "./Field";
import { State } from "../states/State";


export interface NextFieldOptions {
    endForbidden?: boolean
}

export class NextField<T extends State> extends Field<T> {
    required = true;

    private nextTargetName: string;
    private _end: boolean;
    private endForbidden: boolean;

    constructor(state: T, options: NextFieldOptions = {}) {
        super(state);
        if (options.endForbidden !== undefined) {
            this.endForbidden = options.endForbidden;
        }
    }

    to(target: State | string): T {
        if (target instanceof State) {
            this.nextTargetName = target.getName();
        } else {
            this.nextTargetName = target;
        }
        this.receiveConfiguration();
        return this.getParentState();
    }

    isEnd() { return this._end }

    nextStateName() { return this.nextTargetName }

    end(): T {
        if (this.endForbidden === true) {
            throw new Error(`next.End is forbidden to state ${this.getParentState().getName()}`);
        }
        this._end = true;
        this.receiveConfiguration();
        return this.getParentState();
    }
}