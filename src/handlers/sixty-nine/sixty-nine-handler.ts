import {PostHandler} from "../abstract-handler.ts";
import {validatorInputContains} from "../trigger-validator-functions.ts";
import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../types.ts";
import {replyToPost} from "../../agent-post-functions.ts";

export let SixtyNineHandler = new PostHandler(
    ' 69 ',
    validatorInputContains,
    replyToSixtyNine,
    true
)

export function replyToSixtyNine(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = "Nice. 😎";
    replyToPost(agent, postDetails, response)
}