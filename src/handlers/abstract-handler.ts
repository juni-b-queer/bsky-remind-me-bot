import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../types.ts";

abstract class PayloadHandler{
    constructor(private agent: BskyAgent, private triggerKey: string, private triggerValidator, private triggerAction ){}

    shouldTrigger(input: string): boolean {
        return this.triggerValidator(this.triggerKey, input)
    }

    async getPostDetails(op: RepoOp, repo: string): Promise<PostDetails> {
        let rkey = op.path.split('/')[1]
        return await this.agent.getPost({
            repo: repo, rkey: rkey
        });
    }

    abstract handle(op: RepoOp, repo: string): void;


}

export class PostHandler extends PayloadHandler{
    constructor(private agent: BskyAgent, private triggerKey: string, private triggerValidator, private triggerAction) {
        super(agent, triggerKey, triggerValidator, triggerAction);
        return this;
    }

    handle(op: RepoOp, repo: string): void {
        if(this.shouldTrigger(op.payload.text)){
            this.triggerAction(op)
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