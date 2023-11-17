import {PostHandler} from "../abstract-handler.ts";

import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../utils/types.ts";
import {replyToPost} from "../../utils/agent-post-functions.ts";
import {InputContainsValidator} from "../../validators/string-validators.ts";
import {ReplyWithInputAction} from "../../actions/reply-actions.ts";



export let SixtyNineHandler = new PostHandler(
    [new InputContainsValidator(' 69 ')],
    [new ReplyWithInputAction('Nice. 😎')],
    true
)

export function replyToSixtyNine(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = "Nice. 😎";
    replyToPost(agent, postDetails, response)
}