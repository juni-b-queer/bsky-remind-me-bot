import {PostHandler} from "../abstract-handler.ts";
import {validatorInputStartsWith} from "../trigger-validator-functions.ts";
import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../types.ts";
import {REPLIES} from "./well-actually-replies.ts";
import {replyToPost} from "../../agent-post-functions.ts";

export let WellActuallyHandler = new PostHandler( 'wellactually',
    validatorInputStartsWith,
    replyToWellActually,
    true
)

export function replyToWellActually(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = `well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`;
    replyToPost(agent, postDetails, response)
}