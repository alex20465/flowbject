
import { AbstractHydrator } from '../AbstractHydrator';
import { Succeed } from '../../states/Succeed';


export class SucceedStateHydrator extends AbstractHydrator<Succeed, Object> {
    extract(instance: Succeed) {
        let data: any = {};
        return data;
    }
    hydrate(instance: Succeed, data: any) {
        return instance;
    }
}