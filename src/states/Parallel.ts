import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField, Field } from '../fields/index';
import { linkStates } from '../utils';

export class ParallelBranch {
    private startAt: State;
    private states: State[];
    private parent: Parallel;

    constructor(parentState: Parallel) {
        this.parent = parentState;
        this.states = [];
    }

    addState(state: State) {
        if (!this.states.length) {
            this.startAt = state;
        }
        this.states.push(state);
        return this;
    }

    getStartAt() {
        return this.startAt;
    }

    getStates() {
        return this.states.slice(0);
    }

    autoNextSetup() {
        linkStates(this.states);
    }

    validate(): Error | null {
        if (!this.startAt) {
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