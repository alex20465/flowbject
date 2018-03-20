
import { HydratorInterface } from '../HydratorInterface';
import { CatchField } from '../../fields/CatchField';
import { NextFieldHydrator } from './NextFieldHydrator';


export class CatchFieldHydrator implements HydratorInterface<CatchField<any>, Object> {
    extract(instance: CatchField<any>) {
        const nextHydrator = new NextFieldHydrator();
        return {
            Catch: instance.getCatchers().map((cacher) => {
                let cacherData = {
                    ErrorEquals: cacher.getErrors()
                };
                Object.assign(cacherData, nextHydrator.extract(cacher.next));
                if (cacher.resultPath.isConfigured()) {
                    // result path hydrator extraction
                }
                return cacherData;
            })
        }
    }
    hydrate(instance: CatchField<any>, data: any) {

        data.Catch.forEach((catcherData) => {
            const catcher = instance.errors(catcherData.ErrorEquals);
            
        });

        return instance;
    }
}