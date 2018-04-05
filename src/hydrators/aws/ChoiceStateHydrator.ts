
import { AbstractHydrator } from '../AbstractHydrator';
import { Choice } from '../../states/Choice';


export class ChoiceStateHydrator extends AbstractHydrator<Choice, Object> {
    extract(instance: Choice) {
        let data: any = {};
        return data;
    }

    hydrate(instance: Choice, data: any) {
        return instance;
    }
}