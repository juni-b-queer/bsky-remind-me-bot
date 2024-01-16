import {
    AgentDetails, debugLog,
    FunctionAction, PostDetails,
    PostHandler,
    ReplyingToBotValidator,
    ReplyWithInputAction
} from "bsky-event-handlers";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {IsBadBotValidator} from "../validators/ReplyToBotValidators.ts";

export let BadBotHandler = new PostHandler(
    [new IsBadBotValidator(), new ReplyingToBotValidator()],
    [new ReplyWithInputAction("I'm sorry 😓"), new FunctionAction((a: AgentDetails, op: RepoOp, p: PostDetails) => { debugLog("BAD BOT", `Told I'm bad :(`) })],
    false
)

