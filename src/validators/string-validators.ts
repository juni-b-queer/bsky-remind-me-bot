import {AbstractValidator} from "./abstract-validator.ts";
import {flattenTextUpdated} from "../utils/text-utils.ts";

export class InputStartsWithValidator extends AbstractValidator{
    constructor(private triggerKey: string) {
        super();
    }
    shouldTrigger(input: string): boolean {
        const flatText = flattenTextUpdated(this.triggerKey, input)
        return flatText.startsWith(this.triggerKey)
    }

}

export class InputContainsValidator extends AbstractValidator{
    constructor(private triggerKey: string) {
        super();
    }
    shouldTrigger(input: string): boolean {
        const flatText = flattenTextUpdated(this.triggerKey, input)
        return flatText.includes(this.triggerKey);
    }
}

export class InputEqualsValidator extends AbstractValidator{
    constructor(private triggerKey: string) {
        super();
    }
    shouldTrigger(input: string): boolean {
        return input === this.triggerKey;
    }
}