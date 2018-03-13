import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField } from '../fields/index';
import { ChoiceOperationOptions } from './Choice';

export interface ChoiceOperationOptions {
    allowNext?: boolean;
    lockNext?: boolean;
}

export type OperandValueType = string | number | boolean;

export enum CHOICE_COMPARATOR_RULE {
    STRING_EQUALS,
    STRING_LESS_THAN,
    STRING_GREATER_THAN,
    STRING_LESS_THAN_EQUALS,
    STRING_GREATER_THAN_EQUALS,
    NUMERIC_EQUALS,
    NUMERIC_LESS_THAN,
    NUMERIC_GREATER_THAN,
    NUMERIC_LESS_THAN_EQUALS,
    NUMERIC_GREATER_THAN_EQUALS,
    BOOLEAN_EQUALS,
    TIMESTAMP_EQUALS,
    TIMESTAMP_LESS_THAN,
    TIMESTAMP_GREATER_THAN,
    TIMESTAMP_LESS_THAN_EQUALS,
    TIMESTAMP_GREATER_THAN_EQUALS,
}

export enum CHOICE_LOGIC_RULE {
    AND,
    OR,
    NOT,
}

const ComparatorSupportedType: { [k: string]: CHOICE_COMPARATOR_RULE[] } = {
    'boolean': [
        CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS
    ],
    'string': [
        CHOICE_COMPARATOR_RULE.STRING_EQUALS,
        CHOICE_COMPARATOR_RULE.STRING_LESS_THAN,
        CHOICE_COMPARATOR_RULE.STRING_GREATER_THAN,
        CHOICE_COMPARATOR_RULE.STRING_LESS_THAN_EQUALS,
        CHOICE_COMPARATOR_RULE.STRING_GREATER_THAN_EQUALS,
        CHOICE_COMPARATOR_RULE.TIMESTAMP_EQUALS,
        CHOICE_COMPARATOR_RULE.TIMESTAMP_LESS_THAN,
        CHOICE_COMPARATOR_RULE.TIMESTAMP_GREATER_THAN,
        CHOICE_COMPARATOR_RULE.TIMESTAMP_LESS_THAN_EQUALS,
        CHOICE_COMPARATOR_RULE.TIMESTAMP_GREATER_THAN_EQUALS,
    ],
    'number': [
        CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS,
        CHOICE_COMPARATOR_RULE.NUMERIC_LESS_THAN,
        CHOICE_COMPARATOR_RULE.NUMERIC_GREATER_THAN,
        CHOICE_COMPARATOR_RULE.NUMERIC_LESS_THAN_EQUALS,
        CHOICE_COMPARATOR_RULE.NUMERIC_GREATER_THAN_EQUALS,
    ]
}

export abstract class ChoiceOperation {
    protected rule: CHOICE_COMPARATOR_RULE | CHOICE_LOGIC_RULE;
    protected parentState: Choice;
    public next: NextField<Choice>;

    constructor(state: Choice, rule: CHOICE_COMPARATOR_RULE | CHOICE_LOGIC_RULE, options: ChoiceOperationOptions = {}) {
        this.rule = rule;
        this.next = new NextField(state, { locked: options.lockNext });
        this.parentState = state;
    }

    abstract validate(): Error[];

    getRule() {
        return this.rule;
    }
}

export class ChoiceLogicOperation extends ChoiceOperation {
    protected nestedOperations: ChoiceOperation[];

    constructor(state: Choice, rule: CHOICE_LOGIC_RULE, options: ChoiceOperationOptions = {}) {
        super(state, rule, options);
        this.nestedOperations = [];
    }

    createComparatorRule(rule: CHOICE_COMPARATOR_RULE): ChoiceComparatorOperation {
        const operation = new ChoiceComparatorOperation(this.parentState, rule, { allowNext: false, lockNext: true });
        this.nestedOperations.push(operation);
        return operation;
    }

    createLogicRule(rule: CHOICE_LOGIC_RULE): ChoiceLogicOperation {
        const operation = new ChoiceLogicOperation(this.parentState, rule, { allowNext: false, lockNext: true });
        const currentRule = this.getRule();

        this.nestedOperations.push(operation);
        return operation;
    }

    getOperations() {
        return this.nestedOperations.slice(0);
    }

    validate() {
        const errors: Error[] = [];
        if ((this.rule === CHOICE_LOGIC_RULE.AND || this.rule === CHOICE_LOGIC_RULE.OR) && this.nestedOperations.length < 2) {
            errors.push(new Error('Logical operators [AND|OR] require at least TWO nested operations'));
        } else if (this.rule === CHOICE_LOGIC_RULE.NOT && this.nestedOperations.length !== 1) {
            errors.push(new Error('Logical operator [NOT] requires exactly ONE nested operations'));
        }
        if (this.next) {
            const nextError = (<NextField<any>>this.next).validate();
            if (nextError) {
                errors.push(nextError);
            }
        }
        const nestedErrors: Error[] = this.nestedOperations.reduce((errors: Error[], operation) => {
            return errors.concat(operation.validate());
        }, []);
        return errors.concat(nestedErrors);
    }

}

export class ChoiceComparatorOperation extends ChoiceOperation {
    private valueOperand: OperandValueType;
    private variableOperand: string;

    setValue(value: OperandValueType) {

        assertComparatorSupportsValue(value, <CHOICE_COMPARATOR_RULE>this.rule);
        this.valueOperand = value;
        return this;
    }

    setVariable(variable: string) {
        this.variableOperand = variable;
        return this;
    }

    getValue(): OperandValueType {
        return this.valueOperand;
    }

    getVariable(): string {
        return this.variableOperand;
    }

    validate() {
        const errors: Error[] = [];
        if (this.valueOperand === undefined) {
            errors.push(new Error('Value operand of comparator is required'));
        }
        if (this.variableOperand === undefined) {
            errors.push(new Error('Variable operand of comparator is required'));
        }

        return errors;
    }
}

export class Choice extends State {
    private operations: ChoiceOperation[];
    private default: State | null;

    constructor(name: string) {
        super(name);
        this.operations = [];
        this.default = null;
    }

    getDefault() {
        return this.default;
    }

    defaultTo(state: State) {
        this.default = state;
        return this;
    }

    createComparatorRule(rule: CHOICE_COMPARATOR_RULE): ChoiceComparatorOperation {
        const operation = new ChoiceComparatorOperation(this, rule);
        this.operations.push(operation);
        return operation;
    }

    createLogicRule(rule: CHOICE_LOGIC_RULE): ChoiceLogicOperation {
        const operation = new ChoiceLogicOperation(this, rule);
        this.operations.push(operation);
        return operation;
    }

    validate() {
        const errors: Error[] = [];

        if (this.operations.length === 0) {
            errors.push(new Error('Choice requires at least ONE operation'));
        }

        const operationsErrors: Error[] = this.operations.reduce((errors: Error[], operation) => {
            errors = errors.concat(operation.validate());
            return errors;
        }, []);

        return errors.concat(operationsErrors);
    }

    getOperations() {
        return this.operations.slice(0);
    }
}

function assertComparatorSupportsValue(value: OperandValueType, operandRule: CHOICE_COMPARATOR_RULE) {
    const supportedTypes = Object.keys(ComparatorSupportedType);
    const valueType = typeof value;

    if (supportedTypes.indexOf(valueType) === -1) {
        throw new Error(`Comparator value type "${valueType}" is not supported`);
    } else if (ComparatorSupportedType[valueType].indexOf(operandRule) === -1) {
        throw new Error(`OperandRule ${operandRule} does not support value type ${valueType}`);
    }

    return true;
}
