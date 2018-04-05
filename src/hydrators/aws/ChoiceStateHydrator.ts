
import { AbstractHydrator } from '../AbstractHydrator';
import { Choice, ChoiceLogicOperation, CHOICE_COMPARATOR_RULE, CHOICE_LOGIC_RULE, ChoiceComparatorOperation, ChoiceOperation } from '../../states/Choice';
import { AWSStepFunctionsHydratorManager } from '..';

const ComparatorRuleMap: { [k: number]: string } = {
    [CHOICE_COMPARATOR_RULE.STRING_EQUALS]: 'StringEquals',
    [CHOICE_COMPARATOR_RULE.STRING_LESS_THAN]: 'StringLessThan',
    [CHOICE_COMPARATOR_RULE.STRING_GREATER_THAN]: 'StringGreaterThan',
    [CHOICE_COMPARATOR_RULE.STRING_LESS_THAN_EQUALS]: 'StringLessThanEquals',
    [CHOICE_COMPARATOR_RULE.STRING_GREATER_THAN_EQUALS]: 'StringGreaterThanEquals',
    [CHOICE_COMPARATOR_RULE.NUMERIC_EQUALS]: 'NumericEquals',
    [CHOICE_COMPARATOR_RULE.NUMERIC_LESS_THAN]: 'NumericLessThan',
    [CHOICE_COMPARATOR_RULE.NUMERIC_GREATER_THAN]: 'NumericGreaterThan',
    [CHOICE_COMPARATOR_RULE.NUMERIC_LESS_THAN_EQUALS]: 'NumericLessThanEquals',
    [CHOICE_COMPARATOR_RULE.NUMERIC_GREATER_THAN_EQUALS]: 'NumericGreaterThanEquals',
    [CHOICE_COMPARATOR_RULE.BOOLEAN_EQUALS]: 'BooleanEquals',
    [CHOICE_COMPARATOR_RULE.TIMESTAMP_EQUALS]: 'TimestampEquals',
    [CHOICE_COMPARATOR_RULE.TIMESTAMP_LESS_THAN]: 'TimestampLessThan',
    [CHOICE_COMPARATOR_RULE.TIMESTAMP_GREATER_THAN]: 'TimestampGreaterThan',
    [CHOICE_COMPARATOR_RULE.TIMESTAMP_LESS_THAN_EQUALS]: 'TimestampLessThanEquals',
    [CHOICE_COMPARATOR_RULE.TIMESTAMP_GREATER_THAN_EQUALS]: 'TimestampGreaterThanEquals',
};

const LogicRuleMap: { [k: number]: string } = {
    [CHOICE_LOGIC_RULE.AND]: 'And',
    [CHOICE_LOGIC_RULE.OR]: 'Or',
    [CHOICE_LOGIC_RULE.NOT]: 'Not',
}

export class ChoiceStateHydrator extends AbstractHydrator<Choice, AWSStepFunctionsHydratorManager> {
    extract(instance: Choice) {
        let data: any = {};

        data['Choices'] = instance.getOperations().map((operation) => {
            return this.extractChoiceOperation(operation);
        });
        let defaultState = instance.getDefault();
        if (defaultState !== null) {
            data['Default'] = defaultState;
        }
        return data;
    }

    hydrate(instance: Choice, data: any) {

        data['Choices'].forEach((operationData: any) => {
            const operation = this.hydrateChoiceOperation(instance, operationData);
        });

        if(data['Default']) {
            instance.defaultTo(data['Default']);
        }

        return instance;
    }

    private hydrateChoiceOperation(parent: Choice|ChoiceLogicOperation, data: any) {
        const properties = Object.keys(data);
        let logicOperationRule: CHOICE_LOGIC_RULE|null = null;
        const isNotLogicOperation = Object.keys(LogicRuleMap).every((key) => {
            logicOperationRule = parseInt(key);
            return properties.indexOf(LogicRuleMap[parseInt(key)]) === -1;
        });

        if(!isNotLogicOperation && (logicOperationRule !== null)) {
            const operation = parent.createLogicRule(logicOperationRule);
            const logicOperationName = LogicRuleMap[parseInt(logicOperationRule)];
            this.manager.hydrateRelatedFields(operation, data);
            console.log(logicOperationName, data)
            const nestedOperationData: any = data[logicOperationName];
            if(nestedOperationData.length) {
                nestedOperationData.forEach((operationData: any) => {
                    this.hydrateChoiceOperation(operation, operationData);
                });
            } else {
                this.hydrateChoiceOperation(operation, nestedOperationData);
            }
        } else {
            let comparatorOperationRule: CHOICE_COMPARATOR_RULE|null = null;
            Object.keys(ComparatorRuleMap).every((key) => {
                const ruleName = ComparatorRuleMap[parseInt(key)];
                if(data[ruleName] !== undefined) {
                    comparatorOperationRule = parseInt(key);
                    return false;
                } else {
                    return true;
                }
            });
            if(comparatorOperationRule === null) {
                throw new Error('Could not detect comparator operations');
            }
            const operation = parent.createComparatorRule(comparatorOperationRule);
            const comparatorName = ComparatorRuleMap[comparatorOperationRule];
            if(data['Variable']) {
                operation.setVariable(data['Variable']);
            }
            if(data[comparatorName] !== undefined) {
                operation.setValue(data[comparatorName]);
            }
        }
    }

    private extractChoiceOperation(operation: ChoiceOperation) {
        let data: any = {};
        if (operation instanceof ChoiceLogicOperation) {
            const rule = operation.getRule();
            let ruleKeyword = LogicRuleMap[operation.getRule()];
            if (rule === CHOICE_LOGIC_RULE.NOT) {
                data[ruleKeyword] = this.extractChoiceOperation(operation.getOperations()[0]);
            } else {
                data[ruleKeyword] = operation.getOperations().map((operation) => {
                    return this.extractChoiceOperation(operation);
                });
            }
        } else if (operation instanceof ChoiceComparatorOperation) {
            let RuleKeyword = ComparatorRuleMap[operation.getRule()];
            data[RuleKeyword] = operation.getValue();
            data['Variable'] = operation.getVariable();
        }

        data = Object.assign(data, this.manager.extractRelatedFields(operation));

        return data;
    }
}