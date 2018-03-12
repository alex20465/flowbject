import { State } from './State';
import { NextField } from '../fields';

export class Wait extends State {
    public next: NextField<Wait>;
    private seconds: number | null;

    constructor(name: string) {
        super(name);
        this.next = new NextField<Wait>(this);
        this.seconds = null;
    }

    for(seconds: number) {
        return this.setSeconds(seconds);
    }
    getSeconds() {
        return this.seconds;
    }

    setSeconds(seconds: number) {
        if (seconds < 1) {
            throw new Error('Seconds can not be negative');
        }
        this.seconds = seconds;
        return this;
    }

    validate() {
        const errors = super.validate();
        if (!this.getSeconds()) {
            errors.push(new Error('Wait state requires "seconds" definition.'));
        }
        return errors;
    }
}