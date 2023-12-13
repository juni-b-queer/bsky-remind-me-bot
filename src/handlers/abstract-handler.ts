import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails, ValidatorInput} from "../utils/types.ts";
import {AbstractValidator} from "../validators/abstract-validator.ts";
import {AbstractTriggerAction} from "../actions/abstract-trigger-action.ts";
import {getPosterDID} from "../utils/post-details-utils.ts";
import {getPostDetails} from "../utils/agent-post-functions.ts";

abstract class PayloadHandler {
    protected agentDid;
    protected agent: BskyAgent;

    constructor(private triggerValidators: Array<AbstractValidator>, private triggerActions: Array<AbstractTriggerAction>) {
    }

    setAgent(agent: BskyAgent) {
        this.agent = agent;
        this.agentDid = agent.session?.did
    }

    async shouldTrigger(validatorInput: ValidatorInput): Promise<boolean> {
        let willTrigger = true;
        for (const validator of this.triggerValidators) {
            let response = await validator.shouldTrigger(validatorInput)
            if (!response) {
                willTrigger = false
            }
        }
        return willTrigger;
    }

    async runActions(op: RepoOp, postDetails: PostDetails) {
        for (const action of this.triggerActions) {
            await action.handle(this.agent, op, postDetails)
        }
    }

    abstract async handle(op: RepoOp, repo: string): Promise<void>;

}

export class PostHandler extends PayloadHandler {
    protected FOLLOWERS: Array<string>

    constructor(private triggerValidators: Array<AbstractValidator>, private triggerActions: Array<AbstractTriggerAction>, private requireFollowing = true) {
        super(triggerValidators, triggerActions);
        return this;
    }

    setFollowers(followersInput: Array<string>) {
        this.FOLLOWERS = followersInput
        return this;
    }

    postedByUser(postDetails: PostDetails) {
        let postDid = getPosterDID(postDetails);
        return postDid === this.agentDid
    }

    postedByFollower(postDetails: PostDetails) {
        let userPosterDID = getPosterDID(postDetails)
        if (!userPosterDID) {
            return false;
        }
        return this.FOLLOWERS.includes(userPosterDID);
    }

    async handle(op: RepoOp, repo: string): Promise<void> {
        let validatorData: ValidatorInput = {
            op: op,
            repo: repo,
            agent: this.agent
        }
        let shouldTrigger = await this.shouldTrigger(validatorData);
        if (shouldTrigger) {
            try {
                let postDetails = await getPostDetails(this.agent, op, repo);
                if (!this.postedByUser(postDetails)) {
                    if (this.requireFollowing) {
                        if (this.postedByFollower(postDetails)) {
                            await this.runActions(op, postDetails)
                        }
                    } else {
                        await this.runActions(op, postDetails)
                    }
                }
            } catch (exception) {
                console.log(exception)
            }

        }
    }
}

export class HandlerController {
    constructor(private agent: BskyAgent, private handlers: Array<PayloadHandler>) {
        this.refreshFollowers()
    }

    refreshFollowers() {
        if (this.agent.session?.did) {
            this.agent.getFollowers({actor: this.agent.session.did}, {}).then((resp) => {
                let followers = resp.data.followers.map(profile => profile.did);
                this.handlers.forEach((handler) => {
                    handler.setAgent(this.agent)
                    if (handler instanceof PostHandler) {
                        handler.setFollowers(followers);
                    }
                })
            });
        }
    }

    handle(op: RepoOp, repo: string) {
        this.handlers.forEach((handler) => {
            handler.handle(op, repo)
        })
    }
}