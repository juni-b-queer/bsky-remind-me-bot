import {BskyAgent, RichText} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";
import {replyToPost} from "../utils/agent-post-functions.ts";
import {AbstractTriggerAction} from "./abstract-trigger-action.ts";

export class ReplyWithInputAction extends AbstractTriggerAction {
    constructor(private replyText) {
        super();
    }
    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        return await replyToPost(agent, postDetails, this.replyText);
    }
}

export class ReplyWithGeneratedTextAction extends AbstractTriggerAction {
    constructor(private replyGeneratorFunction) {
        super();
    }
    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        let responseText = this.replyGeneratorFunction()
        return await replyToPost(agent, postDetails, responseText);
    }
}

export class ReplyRepetitivelyFromStringArray extends AbstractTriggerAction{
    constructor(private inputArray) {
        super();
    }

    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails) {
        let lastPost = postDetails;
        for (const skeetText of this.inputArray) {
            lastPost = await this.replyWithNextPost(agent, lastPost, skeetText)
            console.log(lastPost)
            await Bun.sleep(50)
        }
    }


    async replyWithNextPost(agent: BskyAgent, currentPost: PostDetails, replyTextInput: string): Promise<PostDetails> {
        const replyText = new RichText({
            text: replyTextInput,
        })

        let reply = {
            root: {
                cid: currentPost.cid,
                uri: currentPost.uri
            },
            parent: {
                cid: currentPost.cid,
                uri: currentPost.uri
            }
        }

        if(currentPost.value.reply){
            reply.root = currentPost.value.reply.root
        }

        let newPost = await agent.post({
            reply: reply,
            text: replyText.text
        });


        return {
            cid: newPost.cid,
            uri: newPost.uri,
            value: {
                reply: reply
            }
        }
    }
}