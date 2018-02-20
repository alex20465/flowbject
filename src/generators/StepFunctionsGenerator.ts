import { AbstractGenerator } from "./AbstractGenerator";
import { StateMachine } from "../StateMachine";
import * as fields from '../fields';
import * as states from '../states';

export class StepFunctionsGenerator extends AbstractGenerator {
    generateStateMachine(stateMachine: StateMachine) {
        const data = {
            StartAt: stateMachine.getStartState().getName(),
            States: {}
        };
        if (stateMachine.getComment()) {
            data['Comment'] = stateMachine.getComment();
        }
        if (stateMachine.getTimeout()) {
            data['TimeoutSeconds'] = stateMachine.getTimeout();
        }
        if (stateMachine.getVersion()) {
            data['Version'] = stateMachine.getVersion();
        }
        data.States = stateMachine.getStates().reduce((states, state) => {
            states[state.getName()] = this.generateState(state);
            return states;
        }, {});
        return data;
    }
    generateNextField(field: fields.NextField<any>): Object {
        if (field.isEnd()) {
            return { End: true };
        } else {
            return { Next: field.nextStateName() };
        }
    }
    generatePathField(field: fields.PathField<any>): Object {
        let data: any = {};

        if (field.getInput()) {
            data['InputPath'] = field.getInput();
        }
        if (field.getOutput()) {
            data['OutputPath'] = field.getOutput();
        }
        return data;
    }
    generateResultField(field: fields.ResultField<any>): Object {
        return { Result: field.getAll() };
    }
    generateResultPathField(field: fields.ResultPathField<any>): Object {
        return {
            ResultPath: field.get()
        }
    }
    generatePass(state: states.Pass): Object {
        return {
            Type: 'Pass'
        }
    }

    generateState(state: states.State) {
        let data = this.getMethodTarget(state).call(this, state);
        const validationErrors = state.validateFields();
        if (validationErrors.length) {
            throw validationErrors[0];
        }
        return state.getFields()
            .filter((field) => field.isConfigured())
            .reduce((result, field) => {
                return Object.assign(result, this.generateField(field));
            }, data);
    }
}