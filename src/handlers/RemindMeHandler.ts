import {
    InputIsCommandValidator,
    getHumanReadableDateTimeStamp,
    HandlerAgent,
    MessageHandler, IsNewPost, CreateLikeAction, JetstreamEventCommit
} from "bsky-event-handlers";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../database/database-handler-actions.ts";
import {Post, PostAttributes} from "../database/database-connection.ts";
import {PostType} from "../database/schema.ts";

const COMMAND = <string>Bun.env.REMIND_ME_COMMAND ?? "RemindMe"

export class RemindMeHandler extends MessageHandler{
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [
                IsNewPost.make(),
                InputIsCommandValidator.make(COMMAND, false)
            ],
            [
                new InsertPostReminderInToDatabase(COMMAND),
                new ReplyWithDataFromDatabase(responseGenerator),
                new CreateLikeAction(MessageHandler.getUriFromMessage, MessageHandler.getCidFromMessage)
            ],
            handlerAgent,
        );
    }

    async handle(handlerAgent:HandlerAgent, message: JetstreamEventCommit): Promise<void> {
        return super.handle(handlerAgent, message);
    }
}
// @ts-ignore
export function responseGenerator(post: PostType) {
    let humanReadable: string;
    let output: string;
    try{
        let tz = post['timezone'] !== "" ? post['timezone'] : "CST"
        let suffixTimezone = tz;
        if(suffixTimezone.length === 3){
            suffixTimezone = suffixTimezone.slice(0, 1) + suffixTimezone.slice(2);
        }
        console.log(post.reminderDate)
        output = `Reminder set for ${getHumanReadableDateTimeStamp(post.reminderDate, tz)} ${suffixTimezone}`
    }catch (e){
        humanReadable = getHumanReadableDateTimeStamp(post.reminderDate);
        output = `Reminder set for ${humanReadable} \n(Timezone not recognized, falling back to America/Chicago)`
    }
    return output
}