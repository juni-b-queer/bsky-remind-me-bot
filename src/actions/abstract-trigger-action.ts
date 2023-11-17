import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";
import {replyToPost} from "../utils/agent-post-functions.ts";

export abstract class AbstractTriggerAction {
    constructor() {
    }

    abstract async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any | void>
}

export class FunctionAction extends AbstractTriggerAction {
    constructor(private actionFunction) {
        super();
    }
    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        await this.actionFunction(agent, op, postDetails)
    }
}



