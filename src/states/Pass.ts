import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField } from '../fields/index';

export class Pass extends State {
    public path: PathField<Pass>;
    public resultPath: ResultPathField<Pass>;
    public result: ResultField<Pass>;
    public next: NextField<Pass>;

    constructor(name: string) {
        super(name);
        this.path = new PathField<Pass>(this);
        this.resultPath = new ResultPathField<Pass>(this);
        this.result = new ResultField<Pass>(this);
        this.next = new NextField<Pass>(this);
    }

    dump() {
        return Object.assign(super.dump(), {
            Type: 'Pass'
        });
    }
}

