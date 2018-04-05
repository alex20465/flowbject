
import { AbstractHydrator } from '../AbstractHydrator';
import { CatchField } from '../../fields/CatchField';
import { NextFieldHydrator } from './NextFieldHydrator';
import { ResultPathFieldHydrator } from './ResultPathFieldHydrator';
import { AbstractHydratorManager } from '../AbstractHydratorManager';
import { AWSStepFunctionsHydratorManager } from '..';


export class CatchFieldHydrator extends AbstractHydrator<CatchField<any>, AWSStepFunctionsHydratorManager> {
    extract(instance: CatchField<any>) {
        return {
            Catch: instance.getCatchers().map((catcher) => {
                let data = {
                    ErrorEquals: catcher.getErrors()
                };
                Object.assign(data, this.manager.extractRelatedFields(catcher));
                return data;
            })
        }
    }

    hydrate(instance: CatchField<any>, data: any) {

        data.Catch.forEach((catcherData: any) => {
            const catcher = instance.errors(catcherData.ErrorEquals);
            this.manager.hydrateRelatedFields(catcher, catcherData);
        });

        return instance;
    }
}