
import { AbstractHydrator } from '../AbstractHydrator';
import { Wait } from '../../states/Wait';


export class WaitStateHydrator extends AbstractHydrator<Wait, Object> {
    extract(instance: Wait) {
        let data: any = {
            Seconds: instance.getSeconds()
        };
        return data;
    }
    hydrate(instance: Wait, data: any) {
        instance.setSeconds(parseInt(data['Seconds']));
        return instance;
    }
}