import {
    DebugLogAction,
    PostHandler,
    ReplyingToBotValidator,
    ReplyWithInputAction
} from "bsky-event-handlers";
import {IsGoodBotValidator} from "../validators/ReplyToBotValidators.ts";


export let GoodBotHandler = new PostHandler(
    [new IsGoodBotValidator(), new ReplyingToBotValidator()],
    [new ReplyWithInputAction("Thank you 🥹"), new DebugLogAction("GOOD BOT", `Told I'm good :)`)],
    false
)

