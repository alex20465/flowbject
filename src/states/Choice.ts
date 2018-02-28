import { State } from './State';
import { PathField, ResultPathField, ResultField, NextField } from '../fields/index';

export enum CHOICE_RULE {
    AND,
    OR,
    NOT,
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


export type OperandValueType = string | number | boolean;

//const ComparatorValueTypeMap: { [k: string]: CHOICE_COMPARATOR[] } = {
//    'boolean': [
//        CHOICE_COMPARATOR.BOOLEAN_EQUALS
//    ],
//    'string': [
//        CHOICE_COMPARATOR.STRING_EQUALS,
//        CHOICE_COMPARATOR.STRING_LESS_THAN,
//        CHOICE_COMPARATOR.STRING_GREATER_THAN,
//        CHOICE_COMPARATOR.STRING_LESS_THAN_EQUALS,
//        CHOICE_COMPARATOR.STRING_GREATER_THAN_EQUALS,
//        CHOICE_COMPARATOR.TIMESTAMP_EQUALS,
//        CHOICE_COMPARATOR.TIMESTAMP_LESS_THAN,
//        CHOICE_COMPARATOR.TIMESTAMP_GREATER_THAN,
//        CHOICE_COMPARATOR.TIMESTAMP_LESS_THAN_EQUALS,
//        CHOICE_COMPARATOR.TIMESTAMP_GREATER_THAN_EQUALS,
//    ],
//    'number': [
//        CHOICE_COMPARATOR.NUMERIC_EQUALS,
//        CHOICE_COMPARATOR.NUMERIC_LESS_THAN,
//        CHOICE_COMPARATOR.NUMERIC_GREATER_THAN,
//        CHOICE_COMPARATOR.NUMERIC_LESS_THAN_EQUALS,
//        CHOICE_COMPARATOR.NUMERIC_GREATER_THAN_EQUALS,
//    ]
//}

export class ChoiceOperation {
    private operator: ChoiceOperator;
    private childOperations: ChoiceOperation[];

    private valueOperand: OperandValueType;
    private variableOperand: string;

    private next: NextField<Choice>;
    constructor(state: Choice, operator: ChoiceOperator) {
        this.operator = operator;
        this.next = new NextField(state);
    }

    setValueOperand(value: OperandValueType) {
        if (!(this.operator instanceof ChoiceComparatorOperator)) {
            throw new Error('Value operand is not allowed in combination with logic operator');
        }
        this.valueOperand = value;
        return this;
    }

    setVariableOperand(variable: string) {
        console.log(this.operator)
        if (!(this.operator instanceof ChoiceComparatorOperator)) {
            throw new Error('Variable operand is not allowed in combination with logic operator');
        }
        this.variableOperand = variable;
        return this;
    }
}

export abstract class ChoiceOperator {
    private rule: CHOICE_RULE;

    constructor(rule: CHOICE_RULE) {
        this.rule = rule;
    }
}

export class ChoiceLogicOperator extends ChoiceOperator { }

export class ChoiceComparatorOperator extends ChoiceOperator { }

export class Choice extends State {
    private operations: any[];
    private default: State;


    constructor(name: string) {
        super(name);
        this.operations = [];
    }

    private createOperatorInstance(rule: CHOICE_RULE) {
        let instance: ChoiceOperator;
        switch (rule) {
            case
                CHOICE_RULE.AND,
                CHOICE_RULE.NOT,
                CHOICE_RULE.OR: {
                    instance = new ChoiceLogicOperator(rule);
                    break;
                }
            default: {
                instance = new ChoiceComparatorOperator(rule);
                break;
            }
        }
        return instance;
    }

    addOperation(rule: CHOICE_RULE) {
        const operator = this.createOperatorInstance(rule);
        const operation = new ChoiceOperation(this, operator);
        this.operations.push(operation);
        return operation;
    }
}