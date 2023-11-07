import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../types.ts";
import {REPLIES} from "../bot-replies.ts";
import {replyToPost} from "../agent-post-functions.ts";

export function replyToWellActually(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = `well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`;
    replyToPost(agent, postDetails, response)
}

export function replyToSixtyNine(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = "Nice. 😎";
    replyToPost(agent, postDetails, response)
}