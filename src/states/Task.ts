import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField, CatchField } from '../fields/index';

export class Task extends State {
    public path: PathField<Task>;
    public resultPath: ResultPathField<Task>;
    public result: ResultField<Task>;
    public next: NextField<Task>;
    public catch: CatchField<Task>;
    private resource: string;

    constructor(name: string) {
        super(name);
        this.path = new PathField<Task>(this);
        this.resultPath = new ResultPathField<Task>(this);
        this.result = new ResultField<Task>(this);
        this.next = new NextField<Task>(this);
        this.catch = new CatchField<Task>(this);
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