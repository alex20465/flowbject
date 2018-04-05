
import { AbstractHydrator } from '../AbstractHydrator';
import { CatchField } from '../../fields/CatchField';
import { NextFieldHydrator } from './NextFieldHydrator';
import { ResultPathFieldHydrator } from './ResultPathFieldHydrator';


export class CatchFieldHydrator extends AbstractHydrator<CatchField<any>, Object> {
    extract(instance: CatchField<any>) {
        const nextHydrator = new NextFieldHydrator();
        const resultPathHydrator = new ResultPathFieldHydrator();
        return {
            Catch: instance.getCatchers().map((cacher) => {
                let data = {
                    ErrorEquals: cacher.getErrors()
                };
                Object.assign(data, nextHydrator.extract(cacher.next));
                if (cacher.resultPath.isConfigured()) {
                    Object.assign(data, resultPathHydrator.extract(cacher.resultPath));
                }
                return data;
            })
        }
    }

    hydrate(instance: CatchField<any>, data: any) {
        const nextHydrator = new NextFieldHydrator();
        const resultPathHydrator = new ResultPathFieldHydrator();

        data.Catch.forEach((catcherData: any) => {
            const catcher = instance.errors(catcherData.ErrorEquals);
            nextHydrator.hydrate(catcher.next, catcherData);
            resultPathHydrator.hydrate(catcher.resultPath, catcherData);
        });

        return instance;
    }
}