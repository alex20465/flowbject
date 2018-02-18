import { Field } from "./Field";
import { State } from "../states/State";

export declare type SupportedValueType = object | string | boolean | number | null;

export declare type ResultType = { [k: string]: SupportedValueType };

export class ResultField<T extends State> extends Field<T> {
    required = false;
    private result: ResultType;
    constructor(state: T) {
        super(state);
        this.result = {};
    }

    set(name: string, value: SupportedValueType): T {
        this.receiveConfiguration();
        this.result[name] = value;
        return this.getParentState();
    }

    get(name: string): SupportedValueType {
        return this.result[name];
    }

    getAll(): ResultType {
        return JSON.parse(JSON.stringify(this.result));
    }

    dump() {
        return { Result: this.getAll() };
    }

    load(result: any) {
        if (result['Result']) {
            Object.keys(result['Result']).forEach((key) => {
                this.set(key, result['Result'][key]);
            })
        }
        return this.getParentState();
    }
}