import * as fields from '../fields';
import * as states from '../states';
import { StateMachine } from '../StateMachine';


export abstract class AbstractGenerator {
    abstract generateStateMachine(stateMachine: StateMachine): Object;
    abstract generateNextField(field: fields.NextField<any>): Object;
    abstract generatePathField(field: fields.PathField<any>): Object;
    abstract generateResultField(field: fields.ResultField<any>): Object;
    abstract generateResultPathField(field: fields.ResultPathField<any>): Object;
    abstract generatePass(state: states.Pass): Object;

    protected getMethodTarget(target: states.State | fields.Field<any>): Function {
        const methodTarget = `generate${target.constructor.name}`;
        if (this[methodTarget] instanceof Function) {
            return this[methodTarget];
        } else {
            throw new Error(`${this.constructor.name} has no generate method ${methodTarget}`);
        }
    }

    generateField(field: fields.Field<any>) {
        return this.getMethodTarget(field).call(this, field);
    }
}