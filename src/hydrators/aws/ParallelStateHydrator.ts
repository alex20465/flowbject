
import { AbstractHydrator } from '../AbstractHydrator';
import { Parallel } from '../../states/Parallel';
import { State } from '../..';
import { AWSStepFunctionsHydratorManager } from '..';


export class ParallelStateHydrator extends AbstractHydrator<Parallel, AWSStepFunctionsHydratorManager> {
    extract(instance: Parallel) {
        let data: any = { };
        data['Branches'] = instance.getBranches().map((branch) => {
            return {
                StartAt: branch.getStartAt().getName(),
                States: branch.getStates().reduce((data: any, state: State) => {
                    data[state.getName()] = this.manager.extractState(state);
                    return data;
                }, {})
            }
        });
        return data;
    }
    hydrate(instance: Parallel, data: any) {

        data['Branches'].map((branchData: any) => {
            const branch = instance.addBranch();
            Object.keys(branchData.States).forEach((stateName) => {
                const stateData = branchData.States[stateName];
                const state = this.manager.hydrateState(stateName, stateData);
                branch.addState(state);
            });
        });

        return instance;
    }
}