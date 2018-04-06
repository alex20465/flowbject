
import { AbstractHydrator } from '../AbstractHydrator';
import { Wait } from '../../states/Wait';
import { AWSStepFunctionsHydratorManager } from '..';


export class WaitStateHydrator extends AbstractHydrator<Wait, AWSStepFunctionsHydratorManager> {
    extract(instance: Wait) {
        let data: any = {
            Seconds: instance.getSeconds()
        };
        Object.assign(data, this.manager.extractRelatedFields(instance));
        return data;
    }
    hydrate(instance: Wait, data: any) {
        instance.setSeconds(parseInt(data['Seconds']));
        this.manager.hydrateRelatedFields(instance, data);
        return instance;
    }
}