import { State, StateList } from './State';
import { PathField, ResultPathField, ResultField, NextField, Field } from '../fields/index';

export class ParallelBranch {
    public states: StateList;
    private parent: Parallel;

    constructor(parentState: Parallel) {
        this.parent = parentState;
        this.states = new StateList();
    }

    validate(): Error | null {
        if (!this.states.getStartStateName()) {
            return new Error('Parallel branch does not contain any start-at state');
        }
        // todo: validate added states
        return null;
    }
}

export class Parallel extends State {
    public next: NextField<Parallel>;
    private branches: ParallelBranch[];
    public path: PathField<Parallel>;
    public resultPath: ResultPathField<Parallel>;

    constructor(name: string) {
        super(name);
        this.branches = [];
        this.next = new NextField<Parallel>(this);
        this.path = new PathField<Parallel>(this);
        this.resultPath = new ResultPathField<Parallel>(this);
    }

    addBranch(branch?: ParallelBranch) {
        if (!branch) {
            branch = new ParallelBranch(this);
        }
        this.branches.push(branch);
        return branch;
    }

    getBranches() {
        return this.branches.slice(0);
    }

    validate() {
        let errors = super.validate();
        if (!this.branches.length) {
            errors.push(new Error('Parallel state requires at least 1 branch.'));
        }

        let branchErrors: Error[] = this.branches.reduce((errors: Error[], branch) => {
            const error = branch.validate();
            if (error) {
                errors.push(error);
            }
            return errors;
        }, []);

        return branchErrors.concat(errors);
    }
}