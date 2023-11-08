import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../types.ts";

abstract class PayloadHandler{
    protected agentDid;
    protected agent: BskyAgent;
    constructor(private triggerKey: string, private triggerValidator, private triggerAction ){}

    setAgent(agent: BskyAgent){
        this.agent = agent;
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
    constructor(private triggerKey: string, private triggerValidator, private triggerAction) {
        super(triggerKey, triggerValidator, triggerAction);
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
    constructor(private agent: BskyAgent, private handlers: Array<PayloadHandler>) {
        this.handlers.forEach((handler) =>{
            handler.setAgent(this.agent)
        })
    }

    handle(op: RepoOp, repo: string){
        this.handlers.forEach((handler) =>{
            handler.handle(op, repo)
        })
    }
}