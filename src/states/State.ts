import { Field, NextField } from "../fields/index";

export abstract class State {
    private comment: string | null;
    private name: string;

    constructor(name: string, comment?: string) {
        this.name = name;
        this.comment = comment || null;
    }

    setComment(comment: string) {
        this.comment = comment;
    }

    getComment() {
        return this.comment;
    }

    getName(): string {
        return this.name;
    }

    getFields(): Field<this>[] {
        return Object.keys(this)
            .filter((propertyName: string) => {
                const property = (<any>this)[propertyName];
                if (property instanceof Field) {
                    return true;
                } else {
                    return false;
                }
            })
            .map((propertyName: string) => {
                return (<any>this)[propertyName];
            });
    }

    validate(): Error[] {
        return this.getFields()
            .map((field) => <Error>field.validate())
            .filter((validationResponse) => validationResponse);
    }
}

export interface StateListOptions {
    autoLink?: boolean
}

export class StateList {
    private states: State[];
    private _state_index: { [k: string]: number }
    private startStateName: string|null;
    private autoLink: boolean;
    constructor(options: StateListOptions =  {}) {
        this.states = [];
        this._state_index = {};
        this.startStateName = null;
        this.autoLink = options.autoLink || false;
    }

    link() {
        let previousState: any;
        this.states.forEach((state) => {
            if (previousState) {
                const next = <NextField<any>>(<any>previousState).next;
                if (next && !next.isConfigured()) {
                    next.set(state);
                }
            }
            previousState = state;
        });
    
        if (previousState) {
            const next = <NextField<any>>(previousState).next;
            if (next && !next.isConfigured()) {
                next.end();
            }
        }
    }

    add(state: State) {
        const index = this.states.push(state) - 1;
        this.indexState(state, index);

        if (this.startStateName === null) {
            this.setStartStateName(state.getName());
        }

        const nextField: NextField<any> = (<any>state).next;
        if(this.autoLink && (nextField instanceof NextField) && !nextField.isConfigured()) {            
            nextField.end();
            if(index > 0) {
                const previousState = this.states[index-1];
                const nextField: NextField<any> = (<any>previousState).next;
                if((nextField instanceof NextField && nextField.isEnd())) {
                    nextField.set(state);
                }
            }
        }

        return this;
    }

    getAll() {
        return this.states.slice(0);
    }
    get(stateName: string): State {
        const idx = this._state_index[stateName];
        if (idx === undefined) {
            throw new Error(`State ${stateName} not found`);
        }
        return this.states[idx];
    }

    getStartStateName() {
        return this.startStateName;
    }

    setStartStateName(stateName: string) {
        this.startStateName = stateName;
    }

    private indexState(state: State, index: number) {
        if (this._state_index[state.getName()]) {
            throw new Error(`State ${state.getName()} already indexed.`);
        } else {
            this._state_index[state.getName()] = index;
        }
    }
}