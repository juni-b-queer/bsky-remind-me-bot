import {
    DebugLogAction,
    PostHandler,
    ReplyingToBotValidator,
    ReplyWithInputAction
} from "bsky-event-handlers";
import {IsBadBotValidator} from "../validators/ReplyToBotValidators.ts";

export let BadBotHandler = new PostHandler(
    [new IsBadBotValidator(), new ReplyingToBotValidator()],
    [new ReplyWithInputAction("I'm sorry 😓"), new DebugLogAction("BAD BOT", `Told I'm bad :(`)],
    false
)

