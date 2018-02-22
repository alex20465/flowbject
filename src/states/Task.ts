import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField, CatchField, RetryField } from '../fields/index';

export class Task extends State {
    public path: PathField<Task>;
    public resultPath: ResultPathField<Task>;
    public result: ResultField<Task>;
    public next: NextField<Task>;
    public retry: RetryField<Task>;
    public catch: CatchField<Task>;
    private resource: string;
    private timeout: number | null;
    private heartbeat: number | null;

    constructor(name: string) {
        super(name);
        this.path = new PathField<Task>(this);
        this.resultPath = new ResultPathField<Task>(this);
        this.result = new ResultField<Task>(this);
        this.next = new NextField<Task>(this);
        this.retry = new RetryField<Task>(this);
        this.catch = new CatchField<Task>(this);
        this.timeout = null;
        this.heartbeat = null;
    }

    setTimeout(timeout: number) {
        this.timeout = timeout;
        return this;
    }
    getTimeout() {
        return this.timeout;
    }

    /**
     * @todo: validate, timeout is required and heartbeat must be smaller.
     */
    setHeartbeat(heartbeat: number) {
        this.heartbeat = heartbeat;
        return this;
    }

    getHeartbeat() {
        return this.heartbeat;
    }

    setResource(resourceIdentity: string): this {
        this.resource = resourceIdentity;
        return this;
    }

    getResource() {
        return this.resource;
    }

    validate() {
        const errors = super.validate();
        if (!this.resource) {
            errors.push(new Error('Task property "resource" is not required'));
        }
        return errors;
    }
}