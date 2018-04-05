
import { AbstractHydrator } from '../AbstractHydrator';
import { Task } from '../../states/Task';


export class TaskStateHydrator extends AbstractHydrator<Task, Object> {
    extract(instance: Task) {
        let data: any = { Resource: instance.getResource() };

        if (instance.getHeartbeat() !== null) {
            data['HeartbeatSeconds'] = instance.getHeartbeat();
        }

        if (instance.getTimeout() !== null) {
            data['TimeoutSeconds'] = instance.getTimeout();
        }

        return data;
    }
    hydrate(instance: Task, data: any) {

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