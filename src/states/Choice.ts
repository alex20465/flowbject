import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField } from '../fields/index';
import { ChoiceOperationOptions } from './Choice';

export interface ChoiceOperationOptions {
    allowNext?: boolean;
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
    protected operator: ChoiceOperator;
    protected parentState: Choice;
    public next: NextField<Choice> | null;

    constructor(state: Choice, operator: ChoiceOperator, options: ChoiceOperationOptions = {}) {
        this.operator = operator;
        if (options.allowNext === false) {
            this.next = null;
        } else {
            this.next = new NextField(state);
        }
        this.parentState = state;
    }

    abstract validate(): Error[];
}

export class ChoiceLogicOperation extends ChoiceOperation {
    protected nestedOperations: ChoiceOperation[];

    constructor(state: Choice, operator: ChoiceOperator, options: ChoiceOperationOptions = {}) {
        super(state, operator, options);
        this.nestedOperations = [];
    }

    addComparatorOperation(rule: CHOICE_COMPARATOR_RULE): ChoiceComparatorOperation {
        const operator = new ChoiceComparatorOperator(rule);
        const operation = new ChoiceComparatorOperation(this.parentState, operator, { allowNext: false });
        this.nestedOperations.push(operation);
        return operation;
    }

    addLogicOperation(rule: CHOICE_LOGIC_RULE): ChoiceLogicOperation {
        const operator = new ChoiceLogicOperator(rule);
        const operation = new ChoiceLogicOperation(this.parentState, operator, { allowNext: false });
        this.nestedOperations.push(operation);
        return operation;
    }

    validate() {
        const errors: Error[] = [];

        const rule = this.operator.getRule();

        if ((rule === CHOICE_LOGIC_RULE.AND || rule === CHOICE_LOGIC_RULE.OR) && this.nestedOperations.length !== 2) {
            errors.push(new Error('Logical operators [AND|OR] require exactly TWO nested operations'));
        } else if (rule === CHOICE_LOGIC_RULE.NOT && this.nestedOperations.length !== 1) {
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

    setValueOperand(value: OperandValueType) {
        if (!(this.operator instanceof ChoiceComparatorOperator)) {
            throw new Error('Value operand is not allowed in combination with logic operator');
        }
        assertComparatorSupportsValue(value, this.operator.getRule());
        this.valueOperand = value;
        return this;
    }

    setVariableOperand(variable: string) {
        if (!(this.operator instanceof ChoiceComparatorOperator)) {
            throw new Error('Variable operand is not allowed in combination with logic operator');
        }
        this.variableOperand = variable;
        return this;
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
export abstract class ChoiceOperator {
    abstract getRule(): CHOICE_LOGIC_RULE | CHOICE_COMPARATOR_RULE;
}

export class ChoiceLogicOperator extends ChoiceOperator {
    private rule: CHOICE_LOGIC_RULE;
    constructor(rule: CHOICE_LOGIC_RULE) {
        super();
        this.rule = rule;
    }
    getRule() {
        return this.rule;
    }
}

export class ChoiceComparatorOperator extends ChoiceOperator {
    private rule: CHOICE_COMPARATOR_RULE;
    constructor(rule: CHOICE_COMPARATOR_RULE) {
        super();
        this.rule = rule;
    }
    getRule() {
        return this.rule;
    }
}

export class Choice extends State {
    private operations: ChoiceOperation[];
    private default: State;

    constructor(name: string) {
        super(name);
        this.operations = [];
    }

    addComparatorOperation(rule: CHOICE_COMPARATOR_RULE): ChoiceComparatorOperation {
        const operator = new ChoiceComparatorOperator(rule);
        const operation = new ChoiceComparatorOperation(this, operator);
        this.operations.push(operation);
        return operation;
    }

    addLogicOperation(rule: CHOICE_LOGIC_RULE): ChoiceLogicOperation {
        const operator = new ChoiceLogicOperator(rule);
        const operation = new ChoiceLogicOperation(this, operator);
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
