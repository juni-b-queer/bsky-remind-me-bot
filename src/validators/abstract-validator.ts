import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";

export abstract class AbstractValidator {

    constructor() {
    }

    abstract shouldTrigger(input: string): boolean

}

/**
 * A validator in which you pass a single function that takes in the post
 * text, and returns a boolean
 */
export class SimpleFunctionValidator extends AbstractValidator {

    constructor(private triggerValidator) {
        super()
    }

    shouldTrigger(input: string): boolean {
        return this.triggerValidator(input)
    }

}

/**
 * A validator in which you pass in multiple other validators
 *  and if any of them should trigger, it will return true
 */
export class OrValidator extends AbstractValidator{
    constructor(private validators: Array<AbstractValidator>) {
        super();
    }

    shouldTrigger(input: string): boolean {
        let willTrigger = false;
        this.validators.forEach((validator) => {
            if(validator.shouldTrigger(input)){
                willTrigger = true;
            }
        })
        return willTrigger;
    }
}