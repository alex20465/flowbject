
import { HydratorInterface } from '../HydratorInterface';
import { PathField } from '../../fields/PathField';


export class PathFieldHydrator implements HydratorInterface<PathField<any>, Object> {
    extract(instance: PathField<any>) {
        let data: any = {};

        if (instance.getInput()) {
            data['InputPath'] = instance.getInput();
        }
        if (instance.getOutput()) {
            data['OutputPath'] = instance.getOutput();
        }
        return data;
    }
    hydrate(instance: PathField<any>, data: any) {
        if (data.InputPath) {
            instance.setInput(data.InputPath);
        }
        if (data.OutputPath) {
            instance.setOutput(data.OutputPath);
        }
        return instance;
    }
}