


export interface HydratorInterface<T, D> {

    hydrate(target: T, data: D): T;

    extract(target: T): D;

}