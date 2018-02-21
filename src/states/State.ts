import { Field } from "../fields/index";

export abstract class State {
    private comment: string | null;
    private name: string;

    constructor(name: string, comment?: string) {
        this.name = name;
        this.comment = comment || null;
    }

    setComment(comment: string) {
        this.comment = comment;
    }

    getComment() {
        return this.comment;
    }

    getName(): string {
        return this.name;
    }

    getFields(): Field<this>[] {
        return Object.keys(this)
            .filter((propertyName: string) => {
                const property = (<any>this)[propertyName];
                if (property instanceof Field) {
                    return true;
                } else {
                    return false;
                }
            })
            .map((propertyName: string) => {
                return (<any>this)[propertyName];
            });
    }

    validate(): Error[] {
        return this.getFields()
            .map((field) => <Error>field.validate())
            .filter((validationResponse) => validationResponse);
    }
}