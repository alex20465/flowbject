
import { AbstractHydrator } from '../AbstractHydrator';
import { AWSStepFunctionsHydratorManager } from '..';
import { StateMachine } from '../../StateMachine';

export class StateMachineHydrator extends AbstractHydrator<StateMachine, AWSStepFunctionsHydratorManager> {
    extract(instance: StateMachine) {
        let data: any = {
            StartAt: instance.getStartState(),
            States: {}
        };
        if (instance.getComment()) {
            data['Comment'] = instance.getComment();
        }
        if (instance.getTimeout()) {
            data['TimeoutSeconds'] = instance.getTimeout();
        }
        if (instance.getVersion()) {
            data['Version'] = instance.getVersion();
        }
        data.States = instance.getStates().reduce((states: any, state) => {
            states[state.getName()] = this.manager.extractState(state);
            return states;
        }, {});
        return data;
    }
    hydrate(instance: StateMachine, data: any) {
        if (data['TimeoutSeconds']) {
            instance.setTimeout(parseInt(data['TimeoutSeconds']));
        }
        if (data['Comment']) {
            instance.setComment(data['Comment']);
        }
        if (data['Version']) {
            instance.setVersion(data['Version']);
        }
        if (data['StartAt']) {
            instance.setStartState(data['StartAt']);
        }
        Object.keys(data['States']).forEach((stateName: string) => {
            const stateData = data['States'][stateName];
            const state = this.manager.hydrateState(stateName, stateData);
            instance.addState(state);
        });
        return instance;
    }
}