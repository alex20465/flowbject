
import { AbstractHydrator } from '../AbstractHydrator';
import { ResultPathField } from '../../fields/ResultPathField';


export class ResultPathFieldHydrator extends AbstractHydrator<ResultPathField<any>, Object> {
    extract(instance: ResultPathField<any>) {
        let data: any = { ResultPath: instance.get() };

        return data;
    }
    hydrate(instance: ResultPathField<any>, data: any) {
        if(data['ResultPath'] === null) {
            instance.discard();
        } else if(data['ResultPath'] !== undefined) {
            instance.set(data['ResultPath']);
        }
        return instance;
    }
}