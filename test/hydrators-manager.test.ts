import { expect } from 'chai';
import { AWSStepFunctionsHydratorManager } from '../src/hydrators';
import { Wait, Task, NextField } from '../src';

describe.only('Hydrator Manager', () => {
    let manager: AWSStepFunctionsHydratorManager;
    let fooState: Task;
    beforeEach(() => {
        manager = new AWSStepFunctionsHydratorManager();
        fooState = new Task('foo');
    });

    it('should extract state Wait', () => {
        const wait = new Wait('foo');
        wait.setSeconds(1);
        const data = manager.extractState(wait);
        expect(data).to.deep.equal({
            Type: 'Wait',
            Seconds: 1
        });
    });


    it('should extract state Task', () => {
        const state = new Task('foo');
        state.setResource('xy').next.end();
        const data = manager.extractState(state);
        expect(data).to.deep.equal({
            Type: 'Task',
            Resource: 'xy',
            End: true
        });
    });

    it('should extract field Next', () => {
        const field = new NextField(fooState);
        field.end();
        const data = manager.extractField(field);
        expect(data).to.deep.equal({
            End: true
        });
    });

});