import {ValidatorInput} from "../utils/types.ts";
import {AbstractValidator} from "./abstract-validator.ts";
import {getPosterDID} from "../utils/post-details-utils.ts";
import {getPostDetails} from "../utils/agent-post-functions.ts";

export class PostedByUserValidator extends AbstractValidator {

    constructor(private userDid: string) {
        super()
    }

    async shouldTrigger(validatorInput: ValidatorInput): Promise<boolean> {
        let postDetails = await getPostDetails(validatorInput.agent, validatorInput.op, validatorInput.repo)
        let posterDID = getPosterDID(postDetails);
        return this.userDid === posterDID;
    }

}
