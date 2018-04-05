
import { AbstractHydrator } from '../AbstractHydrator';
import { Fail } from '../../states/Fail';


export class FailStateHydrator extends AbstractHydrator<Fail, Object> {
    extract(instance: Fail) {
        let data: any = { };

        return data;
    }
    hydrate(instance: Fail, data: any) {
        return instance;
    }
}