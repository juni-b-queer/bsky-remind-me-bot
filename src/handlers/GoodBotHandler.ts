import {
    AgentDetails, debugLog, DebugLogAction,
    FunctionAction, PostDetails,
    PostHandler,
    ReplyingToBotValidator,
    ReplyWithInputAction
} from "bsky-event-handlers";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {IsGoodBotValidator} from "../validators/ReplyToBotValidators.ts";


export let GoodBotHandler = new PostHandler(
    [new IsGoodBotValidator(), new ReplyingToBotValidator()],
    [new ReplyWithInputAction("Thank you 🥹"), new DebugLogAction("GOOD BOT", `Told I'm good :)`)],
    false
)

