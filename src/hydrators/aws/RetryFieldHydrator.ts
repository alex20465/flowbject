
import { AbstractHydrator } from '../AbstractHydrator';
import { RetryField, ERROR_CODES, Retrier } from '../../fields/RetryField';

const ErrorCodes = {
    [ERROR_CODES.TIMEOUT]: 'States.Timeout',
    [ERROR_CODES.ALL]: 'States.ALL',
    [ERROR_CODES.TASK_FAILED]: 'States.TaskFailed',
    [ERROR_CODES.PERMISSIONS]: 'States.Permissions',
    [ERROR_CODES.RESULT_PATH_MATCH_FAILURE]: 'States.ResultPathMatchFailure',
    [ERROR_CODES.BRANCH_FAILED]: 'States.BranchFailed',
    [ERROR_CODES.NO_CHOICE_MATCHED]: 'States.NoChoiceMatched',
};

export class RetryFieldHydrator extends AbstractHydrator<RetryField<any>, Object> {
    extract(instance: RetryField<any>) {
        return {
            Retry: instance.getRetries().map((retrier) => {
                let retrierData = {
                    ErrorEquals: retrier.getErrorTypes().map((code) => {
                        return ErrorCodes[code];
                    }),
                }
                if (retrier.getMaxAttempts() !== null) {
                    Object.assign(retrierData, { MaxAttempts: retrier.getMaxAttempts() });
                }
                if (retrier.getBackoffRate() !== null) {
                    Object.assign(retrierData, { BackoffRate: retrier.getBackoffRate() });
                }
                if (retrier.getInterval() !== null) {
                    Object.assign(retrierData, { IntervalSeconds: retrier.getInterval() });
                }
                return retrierData;
            })
        };
    }

    private findErrorCode(serializedCodeValue: string): ERROR_CODES {
        let found: ERROR_CODES | null = null;
        Object.keys(ErrorCodes).every((code: string) => {
            const errorCode: ERROR_CODES = parseInt(code);
            const value = ErrorCodes[errorCode];

            if (serializedCodeValue === value) {
                found = errorCode;
                return false;
            } else {
                return true;
            }
        });

        if (found === null) {
            throw new Error(`Serialized error code ${serializedCodeValue} is not supported, hydration failed`);
        }

        return found;
    }

    hydrate(instance: RetryField<any>, data: any) {
        const { Retry } = data;

        (Retry || []).forEach((retry: any) => {
            const errorCode = retry.ErrorEquals[0];
            const retrier = instance.createRetrier(this.findErrorCode(errorCode));
            if (retry.MaxAttempts !== undefined) {
                retrier.setMaxAttempts(parseInt(retry.MaxAttempts));
            }
            if (retry.BackoffRate !== undefined) {
                retrier.setBackoffRate(parseInt(retry.BackoffRate));
            }
            if (retry.IntervalSeconds !== undefined) {
                retrier.setInterval(parseInt(retry.IntervalSeconds));
            }

            retrier.setErrorTypes(retry.ErrorEquals.map((val: any) => this.findErrorCode(val)));
        });

        return instance;
    }
}