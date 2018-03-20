import { Field } from "./Field";
import { State } from "../states/State";
import { NextField } from './NextField';
import { ResultPathField } from './ResultPathField';

export enum ERROR_CODES {
    TIMEOUT,
    ALL,
    TASK_FAILED,
    PERMISSIONS,
    RESULT_PATH_MATCH_FAILURE,
    BRANCH_FAILED,
    NO_CHOICE_MATCHED,
}

export class Retrier<T extends State> {
    private parent: T;
    private interval: number | null;
    private backoffRate: number | null;
    private maxAttempts: number | null;
    private errorTypes: ERROR_CODES[];

    constructor(state: T) {
        this.parent = state;
        this.interval = null;
        this.backoffRate = null;
        this.maxAttempts = null;
    }

    setErrorTypes(errorTypes: ERROR_CODES[]) {
        this.errorTypes = errorTypes;
    }
    getErrorTypes() {
        return this.errorTypes.slice(0);
    }
    setInterval(interval: number) {
        this.interval = interval;
        return this.parent;
    }

    getInterval() { return this.interval }

    setBackoffRate(rate: number) {
        this.backoffRate = rate;
        return this.parent;
    }

    getBackoffRate() { return this.backoffRate }

    setMaxAttempts(attempts: number) {
        this.maxAttempts = attempts;
        return this.parent;
    }

    getMaxAttempts() { return this.maxAttempts }
}

export class RetryField<T extends State> extends Field<T> {
    required = false;
    private retriers: Retrier<T>[];
    static ERROR_CODES = ERROR_CODES;
    constructor(state: T) {
        super(state);
        this.retriers = [];
    }

    getRetries() { return this.retriers.slice(0) }

    createRetrier(errorCode: ERROR_CODES): Retrier<T> {
        const retrier = new Retrier<T>(this.getParentState());
        retrier.setErrorTypes([errorCode]);
        this.retriers.push(retrier);
        this.receiveConfiguration();
        return retrier;
    }

    /**
     * Represents: States.Timeout
     * A Task State either ran longer than the “TimeoutSeconds” value,
     * or failed to heartbeat for a time longer than
     * the “HeartbeatSeconds” value.
     */
    timeout(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.TIMEOUT);
    }

    /**
     * Represents: States.ALL
     * A wild-card which matches any Error Name.
     */
    all(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.ALL);
    }

    /**
     * Represents: States.TaskFailed
     * A Task State failed during the execution.
     */
    taskFailure(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.TASK_FAILED);
    }

    /**
     * Represents: States.Permissions
     * A Task State failed because it had insufficient privileges to execute
     * the specified code.
     */
    permissions(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.PERMISSIONS);
    }

    /**
     * Represents: States.ResultPathMatchFailure
     * A Task State’s “ResultPath” field cannot be applied to the
     * input the state received.
     */
    resultPathMatchFailure(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.RESULT_PATH_MATCH_FAILURE);
    }

    /**
     * Represents: States.BranchFailed
     * A branch of a Parallel state failed.
     */
    branchFailure(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.BRANCH_FAILED);
    }

    /**
     * Represents: States.NoChoiceMatched
     * A Choice state failed to find a match for the condition
     * field extracted from its input.
     */
    noChoiceMatch(): Retrier<T> {
        return this.createRetrier(ERROR_CODES.NO_CHOICE_MATCHED);
    }
}