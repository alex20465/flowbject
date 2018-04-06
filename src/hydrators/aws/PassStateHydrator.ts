
import { AbstractHydrator } from '../AbstractHydrator';
import { Pass } from '../../states';
import { AWSStepFunctionsHydratorManager } from '..';


export class PassStateHydrator extends AbstractHydrator<Pass, AWSStepFunctionsHydratorManager> {
    extract(instance: Pass) {
        let data: any = {};
        Object.assign(data, this.manager.extractRelatedFields(instance));
        return data;
    }
    hydrate(instance: Pass, data: any) {
        this.manager.hydrateRelatedFields(instance, data);
        return instance;
    }
}