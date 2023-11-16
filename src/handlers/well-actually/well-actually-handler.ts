import {PostHandler} from "../abstract-handler.ts";
import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../utils/types.ts";
import {REPLIES} from "./well-actually-replies.ts";
import {replyToPost} from "../../utils/agent-post-functions.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";

export let WellActuallyHandler = new PostHandler(
    [new InputStartsWithValidator('wellactually')],
    replyToWellActually,
    true
)

export function replyToWellActually(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = `well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`;
    replyToPost(agent, postDetails, response)
}