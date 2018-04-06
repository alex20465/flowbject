import * as hydrators from './aws';
import * as states from '../states';
import * as fields from '../fields';
import { AbstractHydratorManager } from './AbstractHydratorManager';
import { StateMachine } from '../StateMachine';
import { AbstractHydrator } from './AbstractHydrator';

interface StateHydratorRegistry {
    hydrator: any;
    cls: Object;
    typeName: string;
}

interface FieldHydratorRegistry {
    hydrator: any;
    cls: Object;
}

const stateHydratorRegistery: StateHydratorRegistry[] = [
    {
        hydrator: hydrators.ChoiceStateHydrator,
        cls: states.Choice,
        typeName: 'Choice',
    },
    {
        hydrator: hydrators.FailStateHydrator,
        cls: states.Fail,
        typeName: 'Fail',
    },
    {
        hydrator: hydrators.ParallelStateHydrator,
        cls: states.Parallel,
        typeName: 'Parallel',
    },
    {
        hydrator: hydrators.SucceedStateHydrator,
        cls: states.Succeed,
        typeName: 'Succeed',
    },
    {
        hydrator: hydrators.TaskStateHydrator,
        cls: states.Task,
        typeName: 'Task',
    },
    {
        hydrator: hydrators.WaitStateHydrator,
        cls: states.Wait,
        typeName: 'Wait',
    },
    {
        hydrator: hydrators.PassStateHydrator,
        cls: states.Pass,
        typeName: 'Pass',
    },
]

const fieldHydratorRegistry: FieldHydratorRegistry[] = [
    {
        cls: fields.CatchField,
        hydrator: hydrators.CatchFieldHydrator
    },
    {
        cls: fields.NextField,
        hydrator: hydrators.NextFieldHydrator
    },
    {
        cls: fields.PathField,
        hydrator: hydrators.PathFieldHydrator
    },
    {
        cls: fields.ResultField,
        hydrator: hydrators.ResultFieldHydrator
    },
    {
        cls: fields.ResultPathField,
        hydrator: hydrators.ResultPathFieldHydrator
    },
    {
        cls: fields.RetryField,
        hydrator: hydrators.RetryFieldHydrator
    }
];

export class AWSStepFunctionsHydratorManager extends AbstractHydratorManager {
    extractState(state: states.State): any {
        const hydrator = this.getStateHydrator(state);
        const data: any = hydrator.extract(state);

        Object.assign(data, this.extractRelatedFields(state), {
            Type: state.constructor.name,
        });

        if (state.getComment()) {
            data['Comment'] = state.getComment();
        }

        return data;
    }
    extractField(field: fields.Field<any>): any {
        const hydrator = this.getFieldHydrator(field);
        return hydrator.extract(field);
    }
    extractStateMachine(stateMachine: StateMachine): any {
        let data: any = {
            StartAt: stateMachine.getStartState(),
            States: {}
        };
        if (stateMachine.getComment()) {
            data['Comment'] = stateMachine.getComment();
        }
        if (stateMachine.getTimeout()) {
            data['TimeoutSeconds'] = stateMachine.getTimeout();
        }
        if (stateMachine.getVersion()) {
            data['Version'] = stateMachine.getVersion();
        }
        data.States = stateMachine.getStates().reduce((states: any, state) => {
            states[state.getName()] = this.extractState(state);
            return states;
        }, {});
        return data;
    }

    extractRelatedFields(target: any) {
        let data = {};
        const relatedFields = this.getRelatedConfiguredFields(target);
        return relatedFields.reduce((data, field) => {
            return Object.assign(data, this.extractField(field));
        }, data);
    }
    hydrateRelatedFields(target: any, data: any): any {
        const relatedFields = this.getRelatedConfiguredFields(target, false);
        relatedFields.forEach((field) => {
            this.hydrateField(field, data);
        });
    }

    hydrateState(name: string, data: any): states.State {
        const registry = this.getStateRegistryByTypeName(data['Type']);
        const state: states.State = new (<any>registry.cls)(name);
        const hydrator: AbstractHydrator<any, this> = new (<any>registry.hydrator)(this);
        return hydrator.hydrate(state, data);
    }

    hydrateField(field: fields.Field<any>, data: any): fields.Field<any> {
        const hydrator = this.getFieldHydrator(field);
        hydrator.hydrate(field, data);
        return field;
    }
    hydrateStateMachine(stateMachine: StateMachine, data: any): StateMachine {
        if(data['TimeoutSeconds']) {
            stateMachine.setTimeout(parseInt(data['TimeoutSeconds']));
        }
        if(data['Comment']) {
            stateMachine.setComment(data['Comment']);
        }
        if(data['Version']) {
            stateMachine.setVersion(data['Version']);
        }
        if(data['StartAt']) {
            stateMachine.setStartState(data['StartAt']);
        }
        Object.keys(data['States']).forEach((stateName: string) => {
            const stateData = data['States'][stateName];
            const state = this.hydrateState(stateName, stateData);
            stateMachine.addState(state);
        });
        return stateMachine;
    }

    getRelatedConfiguredFields(target: any, onlyConfigured: boolean = true): fields.Field<any>[] {
        const properies = Object.keys(target);

        return properies.filter((name: string) => {
            const property = target[name];
            if (property instanceof fields.Field && (onlyConfigured === false || property.isConfigured())) {
                return true;
            } else {
                return false;
            }
        })
            .map((name) => target[name]);
    }

    private getFieldHydrator(field: fields.Field<any>): AbstractHydrator<any, any> {
        let hydrator: AbstractHydrator<fields.Field<any>, any> | null = null;

        fieldHydratorRegistry.every((registry: FieldHydratorRegistry) => {
            if (field instanceof (<any>registry.cls)) {
                hydrator = new (<any>registry.hydrator)(this);
                return false;
            } else {
                return true;
            }
        });
        if (!hydrator) {
            throw new Error(`State hydrator for ${field} not found`);
        } else {
            return hydrator;
        }
    }

    private getStateHydrator<T>(state: states.State): AbstractHydrator<T, any> {
        let hydrator: AbstractHydrator<states.State, any> | null = null;
        stateHydratorRegistery.every((registry: StateHydratorRegistry) => {
            if (state instanceof (<any>registry.cls)) {
                hydrator = new (<any>registry.hydrator)(this);
                return false;
            } else {
                return true;
            }
        });

        if (!hydrator) {
            throw new Error(`State hydrator for ${state} not found`);
        } else {
            return hydrator;
        }
    }

    private getStateRegistryByTypeName(typeName: string): StateHydratorRegistry {
        let registry: StateHydratorRegistry | null = null;
        stateHydratorRegistery.every((reg: StateHydratorRegistry) => {
            if (reg.typeName === typeName) {
                registry = reg;
                return false;
            } else {
                return true;
            }
        });

        if (!registry) {
            throw new Error(`No state-registry with type ${typeName} found`);
        } else {
            return registry;
        }
    }
}