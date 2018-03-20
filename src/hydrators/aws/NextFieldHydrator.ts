
import { HydratorInterface } from '../HydratorInterface';
import { NextField } from '../..';


export class NextFieldHydrator implements HydratorInterface<NextField<any>, Object> {
    extract(instance: NextField<any>) {
        if (instance.isLocked()) {
            return {};
        } else if (instance.isEnd()) {
            return { End: true };
        } else {
            return { Next: instance.nextStateName() };
        }
    }
    hydrate(instance: NextField<any>, data: any) {
        if (data['End'] === true) {
            instance.end();
        } else if (data['Next']) {
            instance.to(data['Next']);
        }
        return instance;
    }
}