import {PostHandler} from "../abstract-handler.ts";
import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../utils/types.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";
import {LogInputTextAction, LogPostDetailsAction, LogRepoOperationAction} from "../../actions/logging-actions.ts";

export let TestHandler = new PostHandler(
    [new InputStartsWithValidator('h')],
    [new LogPostDetailsAction(), new LogRepoOperationAction(), new LogInputTextAction('Logged text')],
    true
)

export function replyToTestHandler(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    console.log(postDetails.value.text)
    console.log('Should respond')
}