import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {ValidatorInput} from "../utils/types.ts";

export abstract class AbstractValidator {

    constructor() {
    }

    getTextFromPost(op: RepoOp) {
        return op.payload.text;
    }

    abstract async shouldTrigger(validatorInput: ValidatorInput): Promise<boolean>

}

/**
 * A validator in which you pass a single function that takes in the post
 * text, and returns a boolean
 */
export class SimpleFunctionValidator extends AbstractValidator {

    constructor(private triggerValidator) {
        super()
    }

    async shouldTrigger(validatorInput: ValidatorInput): Promise<boolean> {
        return this.triggerValidator(validatorInput)
    }

}

/**
 * A validator in which you pass in multiple other validators
 *  and if any of them should trigger, it will return true
 */
export class OrValidator extends AbstractValidator {
    constructor(private validators: Array<AbstractValidator>) {
        super();
    }

    async shouldTrigger(validatorInput: ValidatorInput): Promise<boolean> {
        let willTrigger = false;
        for (const validator of this.validators) {
            let currentValidatorWillTrigger = await validator.shouldTrigger(validatorInput);
            if (currentValidatorWillTrigger) {
                willTrigger = true;
            }
        }
        return willTrigger;
    }
}