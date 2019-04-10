
import { AbstractHydrator } from '../AbstractHydrator';
import { Task } from '../../states/Task';
import { AWSStepFunctionsHydratorManager } from '../AWSStepFunctionsHydratorManager';


export class TaskStateHydrator extends AbstractHydrator<Task, AWSStepFunctionsHydratorManager> {
    extract(instance: Task) {
        let data: any = { Resource: instance.getResource() };

        Object.assign(data, this.manager.extractRelatedFields(instance));

        if (instance.getHeartbeat() !== null) {
            data['HeartbeatSeconds'] = instance.getHeartbeat();
        }

        if (instance.getTimeout() !== null) {
            data['TimeoutSeconds'] = instance.getTimeout();
        }

        return data;
    }
    hydrate(instance: Task, data: any) {
        this.manager.hydrateRelatedFields(instance, data);

        if(data['HeartbeatSeconds']) {
            instance.setHeartbeat(data['HeartbeatSeconds']);
        }

        if(data['TimeoutSeconds']) {
            instance.setTimeout(data['TimeoutSeconds']);
        }

        instance.setResource(data['Resource']);

        return instance;
    }
}