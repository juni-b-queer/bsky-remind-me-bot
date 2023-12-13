import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";
import {AbstractValidator} from "../validators/abstract-validator.ts";
import {AbstractTriggerAction} from "../actions/abstract-trigger-action.ts";

abstract class PayloadHandler {
    protected agentDid;
    protected agent: BskyAgent;

    constructor(private triggerValidators: Array<AbstractValidator>, private triggerActions: Array<AbstractTriggerAction>) {
    }

    setAgent(agent: BskyAgent) {
        this.agent = agent;
        this.agentDid = agent.session?.did
    }

    shouldTrigger(input: string): boolean {
        let willTrigger = true;
        this.triggerValidators.forEach((validator) => {
            let response = validator.shouldTrigger(input)
            if (!response) {
                willTrigger = false
            }
        })
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
        let postDid = postDetails.uri.split('/')[2];
        return postDid === this.agentDid
    }

    postedByFollower(postDetails: PostDetails) {
        let userPosterDID = (postDetails.uri.match(/did:[^\/]*/) || [])[0]
        if(!userPosterDID){
            return false;
        }
        return this.FOLLOWERS.includes(userPosterDID);
    }

    async getPostDetails(op: RepoOp, repo: string): Promise<PostDetails> {
        let rkey = op.path.split('/')[1]
        return await this.agent.getPost({
            repo: repo, rkey: rkey
        });
    }

    async handle(op: RepoOp, repo: string): Promise<void> {
        if (this.shouldTrigger(op.payload.text)) {
            try {
                let postDetails = await this.getPostDetails(op, repo);
                if (!this.postedByUser(postDetails)) {
                    if (this.requireFollowing) {
                        if (this.postedByFollower(postDetails)) {
                            this.runActions(op, postDetails)
                        }
                    } else {
                        this.runActions(op, postDetails)
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
        if (agent.session?.did) {
            agent.getFollowers({actor: agent.session.did}, {}).then((resp) => {
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