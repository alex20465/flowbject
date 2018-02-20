import { expect } from 'chai';
import { StepFunctionsGenerator } from '../src/generators/StepFunctionsGenerator';
import { NextField } from '../src/fields';
import { Pass } from '../src/states/Pass';
import { State } from '../src/states';
import { StateMachine } from '../src/StateMachine';

describe('AWSStepFunctions', () => {
    describe('generateField', () => {
        let generator: StepFunctionsGenerator;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
        });

        it('should generate field next', () => {
            const state = (new Pass('foo')).next.end();
            const data = generator.generateField(state.next);
            expect(data).to.deep.equal({
                End: true
            });
        })
    });

    describe('generateState', () => {
        let generator: StepFunctionsGenerator;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
        });

        it('should generate field next', () => {
            const state = (new Pass('foo')).next.end();
            const data = generator.generateState(state);
            expect(data).to.deep.equal({
                Type: 'Pass',
                End: true
            });
        })
    });

    describe('generateStateMachine', () => {
        let generator: StepFunctionsGenerator;
        let fooState: State;
        let barState: State;
        let stateMachine: StateMachine;

        beforeEach(() => {
            generator = new StepFunctionsGenerator();
            barState = (new Pass('bar'))
                .path.setOutput('$.out')
                .next.end();
            fooState = (new Pass('foo'))
                .path.setInput('$.test')
                .path.setOutput('$.test2')
                .next.toState(barState);

            stateMachine = (new StateMachine())
                .addState(fooState)
                .addState(barState);
        });

        it('should generate field next', () => {
            const data = generator.generateStateMachine(stateMachine);
            expect(data).to.deep.equal({
                StartAt: 'foo',
                States: {
                    foo: {
                        Next: 'bar',
                        InputPath: '$.test',
                        OutputPath: '$.test2',
                        Type: "Pass"
                    },
                    bar: {
                        End: true,
                        OutputPath: "$.out",
                        Type: "Pass"
                    }
                }
            });
        });
    })
});