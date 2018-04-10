
import { AbstractHydrator } from '../AbstractHydrator';
import { Parallel } from '../../states/Parallel';
import { State } from '../..';
import { AWSStepFunctionsHydratorManager } from '..';


export class ParallelStateHydrator extends AbstractHydrator<Parallel, AWSStepFunctionsHydratorManager> {
    extract(instance: Parallel) {
        let data: any = { };
        data['Branches'] = instance.getBranches().map((branch) => {
            return {
                StartAt: branch.states.getStartStateName(),
                States: branch.states.getAll().reduce((data: any, state: State) => {
                    data[state.getName()] = this.manager.extractState(state);
                    return data;
                }, {})
            }
        });
        Object.assign(data, this.manager.extractRelatedFields(instance));
        return data;
    }
    hydrate(instance: Parallel, data: any) {

        data['Branches'].map((branchData: any) => {
            const branch = instance.addBranch();
            Object.keys(branchData.States).forEach((stateName) => {
                const stateData = branchData.States[stateName];
                const state = this.manager.hydrateState(stateName, stateData);
                branch.states.add(state);
            });
        });
        this.manager.hydrateRelatedFields(instance, data);
        return instance;
    }
}