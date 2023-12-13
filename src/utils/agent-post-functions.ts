import {PostDetails} from "./types.ts";
import {BskyAgent, RichText} from "@atproto/api";

/**
 * Replies to the skeet
 **/

export async function replyToPost(agent: BskyAgent, currentPost: PostDetails, replyTextInput: string) {
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

    if (currentPost.value.reply) {
        reply.root = currentPost.value.reply.root
    }

    return await agent.post({
        reply: reply,
        text: replyText.text
    });
}

export async function getPostDetails(agent: BskyAgent, op: RepoOp, repo: string) {
    let rkey = op.path.split('/')[1]
    return await agent.getPost({
        repo: repo, rkey: rkey
    });
}