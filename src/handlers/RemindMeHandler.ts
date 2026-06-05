import {
    InputIsCommandValidator,
    getHumanReadableDateTimeStamp,
    HandlerAgent,
    MessageHandler, IsNewPost, CreateLikeAction, JetstreamEventCommit, CanReplyToThreadValidator, LogInputTextAction
} from "bsky-event-handlers";
import {
    InsertPostReminderInToDatabase, InsertPostReminderInToDatabaseNewParser,
    MessageWithDataFromDatabase,
    ReplyWithDataFromDatabase
} from "../database/database-handler-actions.ts";
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

                new CreateLikeAction(MessageHandler.getUriFromMessage, MessageHandler.getCidFromMessage),
                // Can reply
                new MessageHandler(
                    [CanReplyToThreadValidator.make(MessageHandler.getRootUriFromMessage)],
                    [
                        new InsertPostReminderInToDatabaseNewParser(COMMAND),
                        new ReplyWithDataFromDatabase(responseGenerator),

                    ],
                    handlerAgent
                ),
                // Can't reply
                new MessageHandler(
                    [CanReplyToThreadValidator.make(MessageHandler.getRootUriFromMessage).not()],
                    [
                        new InsertPostReminderInToDatabaseNewParser(COMMAND, true),
                        new MessageWithDataFromDatabase(responseGenerator)
                    ],
                    handlerAgent
                ),
            ],
            handlerAgent,
        );
    }

    async handle(handlerAgent:HandlerAgent, message: JetstreamEventCommit): Promise<void> {
        return super.handle(handlerAgent, message);
    }
}

export class SilentRemindMeHandler extends MessageHandler{
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [
                IsNewPost.make(),
                InputIsCommandValidator.make(`Silent${COMMAND}`, false)
            ],
            [
                new InsertPostReminderInToDatabaseNewParser(`Silent${COMMAND}`, true),
                new CreateLikeAction(MessageHandler.getUriFromMessage, MessageHandler.getCidFromMessage),
                new MessageWithDataFromDatabase(responseGenerator)
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
        output = `Reminder set for ${getHumanReadableDateTimeStamp(post.reminderDate, tz)} ${suffixTimezone}`
    }catch (e){
        humanReadable = getHumanReadableDateTimeStamp(post.reminderDate);
        output = `Reminder set for ${humanReadable} \n(Timezone not recognized, falling back to America/Chicago)`
    }
    return output
}