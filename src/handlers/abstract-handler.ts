import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../types.ts";

abstract class PayloadHandler{
    protected agentDid;
    constructor(private agent: BskyAgent, private triggerKey: string, private triggerValidator, private triggerAction ){
        this.agentDid = agent.session?.did
    }

    shouldTrigger(input: string): boolean {
        return this.triggerValidator(this.triggerKey, input)
    }

    async getPostDetails(op: RepoOp, repo: string): Promise<PostDetails> {
        let rkey = op.path.split('/')[1]
        return await this.agent.getPost({
            repo: repo, rkey: rkey
        });
    }

    abstract async handle(op: RepoOp, repo: string): Promise<void>;

}

export class PostHandler extends PayloadHandler{
    constructor(private agent: BskyAgent, private triggerKey: string, private triggerValidator, private triggerAction) {
        super(agent, triggerKey, triggerValidator, triggerAction);
        return this;
    }

    postedByUser(postDetails: PostDetails){
        let postDid = postDetails.uri.split('/')[2];
        return postDid === this.agentDid
    }

    async handle(op: RepoOp, repo: string): Promise<void> {
        if (this.shouldTrigger(op.payload.text)) {
            let postDetails = await this.getPostDetails(op, repo);
            if(!this.postedByUser(postDetails)){
                this.triggerAction(this.agent, op, postDetails)
            }
        }
    }
}

export class HandlerController{
    constructor(private handlers: Array<PayloadHandler>) {
    }

    handle(op: RepoOp, repo: string){
        this.handlers.forEach((handler) =>{
            handler.handle(op, repo)
        })
    }
}