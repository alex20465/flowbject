import { AbstractHydratorManager } from "./AbstractHydratorManager";

export abstract class AbstractHydrator<T, M> {
    protected manager: M;
    constructor(manager: M) {
        this.manager = manager;
    }
    abstract hydrate(target: T, data: object): T;
    abstract extract(target: T): object;
}