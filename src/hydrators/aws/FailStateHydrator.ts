
import { AbstractHydrator } from '../AbstractHydrator';
import { Fail } from '../../states/Fail';


export class FailStateHydrator extends AbstractHydrator<Fail, Object> {
    extract(instance: Fail) {
        let data: any = {
            Error: instance.getErrorType(),
            Cause: instance.getErrorMessage()
        };

        return data;
    }
    hydrate(instance: Fail, data: any) {
        const err = new Error(data['Cause']);
        err.name = data['Error'];
        instance.withError(err);
        return instance;
    }
}