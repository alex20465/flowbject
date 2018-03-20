
import { HydratorInterface } from '../HydratorInterface';
import { ResultField } from '../../fields/ResultField';


export class ResultFieldHydrator implements HydratorInterface<ResultField<any>, Object> {
    extract(instance: ResultField<any>) {
        return { Result: instance.get() };
    }
    hydrate(instance: ResultField<any>, data: any) {
        if (data.Result !== undefined) {
            instance.set(data.Result);
        }
        return instance;
    }
}