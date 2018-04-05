
export abstract class AbstractHydrator<T, D> {
    abstract hydrate(target: T, data: D): T;
    abstract extract(target: T): D;
}