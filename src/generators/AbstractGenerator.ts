import * as fields from '../fields';
import * as states from '../states';
import { StateMachine } from '../StateMachine';
import { EventEmitter } from 'events';

export abstract class AbstractGenerator {
    protected emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

    on(eventName: string, listener: (target: (fields.Field<any> | states.State)) => void) {
        this.emitter.on(eventName, listener);
    }

    abstract generateStateMachine(stateMachine: StateMachine): Object;
    abstract generateNextField(field: fields.NextField<any>): Object;
    abstract generatePathField(field: fields.PathField<any>): Object;
    abstract generateResultField(field: fields.ResultField<any>): Object;
    abstract generateResultPathField(field: fields.ResultPathField<any>): Object;
    abstract generateRetryField(field: fields.RetryField<any>): Object;
    abstract generateCatchField(field: fields.CatchField<any>): Object;
    abstract generateWait(state: states.Wait): Object;
    abstract generateSucceed(state: states.Succeed): Object;
    abstract generateFail(state: states.Fail): Object;
    abstract generateParallel(state: states.Parallel): Object;
    abstract generateChoice(state: states.Choice): Object;
    abstract generatePass(state: states.Pass): Object;
    abstract generateTask(task: states.Task): Object;

    protected getMethodTarget(target: states.State | fields.Field<any>): Function {
        const methodTarget = `generate${target.constructor.name}`;
        const self: any = this; // dynamic declaration
        if (self[methodTarget] instanceof Function) {
            return self[methodTarget];
        } else {
            throw new Error(`${this.constructor.name} has no generate method ${methodTarget}`);
        }
    }

    generateState(state: states.State) {
        let data = this.getMethodTarget(state).call(this, state);
        const validationErrors = state.validate();
        if (validationErrors.length) {
            throw validationErrors[0];
        }
        return state.getFields()
            .filter((field) => field.isConfigured())
            .reduce((result, field) => {
                return Object.assign(result, this.generateField(field));
            }, data);
    }

    generateField(field: fields.Field<any>) {
        this.emitter.emit(`before::generate::field::${field.constructor.name}`, field);
        const res = this.getMethodTarget(field).call(this, field);
        this.emitter.emit(`after::generate::field::${field.constructor.name}`, field);
        return res;
    }

    generate(target: fields.Field<any> | states.State | StateMachine | states.ChoiceOperation) {
        if (target instanceof fields.Field) {
            return this.generateField(target);
        } else if (target instanceof StateMachine) {
            return this.generateStateMachine(target);
        } else if (target instanceof states.State) {
            return this.generateState(target);
        } else {
            throw new Error('Unknown target type.');
        }
    }
}