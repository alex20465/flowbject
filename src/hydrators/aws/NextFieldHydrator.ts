
import { AbstractHydrator } from '../AbstractHydrator';
import { NextField } from '../..';


export class NextFieldHydrator extends AbstractHydrator<NextField<any>, Object> {
    extract(instance: NextField<any>) {
        if (instance.isLocked()) {
            return {};
        } else if (instance.isEnd()) {
            return { End: true };
        } else {
            return { Next: instance.get() };
        }
    }
    hydrate(instance: NextField<any>, data: any) {
        if (data['End'] === true) {
            instance.setEnd();
        } else if (data['Next']) {
            instance.set(data['Next']);
        }
        return instance;
    }
}