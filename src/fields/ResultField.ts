import { Field } from "./Field";
import { State } from "../states/State";

export declare type SupportedValueType = object | string | boolean | number | null | { [k: string]: SupportedValueType };

export class ResultField<T extends State> extends Field<T> {
    required = false;
    private result: any;
    constructor(state: T) {
        super(state);
        this.result = null;
    }

    set(value: SupportedValueType): T {
        this.receiveConfiguration();
        this.result = value;
        this.receiveConfiguration();
        return this.getParentState();
    }

    get(): SupportedValueType {
        return JSON.parse(JSON.stringify(this.result));
    }
}