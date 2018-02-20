import { Field } from "./Field";
import { State } from "../states/State";

export class NextField<T extends State> extends Field<T> {
    required = true;

    private nextTargetName: string;
    private _end: boolean;

    toState(target: State | string): T {
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
        this._end = true;
        this.receiveConfiguration();
        return this.getParentState();
    }
}