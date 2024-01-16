import {
    AgentDetails, debugLog,
    FunctionAction, PostDetails,
    PostHandler,
    ReplyingToBotValidator,
    ReplyWithInputAction
} from "bsky-event-handlers";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {IsGoodBotValidator} from "../validators/ReplyToBotValidators.ts";


export let GoodBotHandler = new PostHandler(
    [new IsGoodBotValidator(), new ReplyingToBotValidator()],
    [new ReplyWithInputAction("Thank you 🥹"), new FunctionAction((a: AgentDetails, op: RepoOp, p: PostDetails) => { debugLog("GOOD BOT", `Told I'm good :)`) })],
    false
)

