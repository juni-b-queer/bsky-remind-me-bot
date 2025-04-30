import {
    AbstractMessageAction,
    CreateSkeetMessage,
    DebugLog,
    HandlerAgent, JetstreamEventCommit, MessageHandler, NewSkeetRecord,
    ReplyToSkeetAction,
    trimCommandInput
} from "bsky-event-handlers";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {extractTimeFromInput, extractTimezone, extractTimezoneAbbreviation} from "time-decoding-utils";
import {dbClient} from "./index.ts";

export class InsertPostReminderInToDatabase extends AbstractMessageAction {

    constructor(private commandKey: string) {
        super();
    }

    async handle(handlerAgent: HandlerAgent, message: JetstreamEventCommit ): Promise<any> {
        // Get timing from post
        let timeString: string | boolean;
        let reminderDate: string;
        let timezone: boolean | string;
        let postText: string
        try {
            const skeetRecord: NewSkeetRecord = message.commit.record as NewSkeetRecord;
             postText = skeetRecord.text ?? "";
            timeString = trimCommandInput(postText, this.commandKey);
            if (typeof timeString == "boolean") {
                DebugLog.error("INSERT", `Trim command returned false: ${postText}`)
                return;
            }
            timezone = extractTimezoneAbbreviation(timeString)
            if (typeof timezone === "boolean") {
                timezone = extractTimezone(timeString)
                if (typeof timezone === "boolean") {
                    timezone = ""
                }
            }

            const postTime = new Date(skeetRecord.createdAt);

            reminderDate = extractTimeFromInput(timeString, timezone, postTime)
        } catch (e) {
            // @ts-ignore
            DebugLog.error("INSERT", e + `: ${message.record.text}`)
            // console.log("ERROR - Exception")
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(handlerAgent, message);
            return;
        }


        if (reminderDate === "") {
            //reply with
            DebugLog.error("INSERT", `empty reminder date: ${postText}`)
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(handlerAgent, message);
            return;
        }


        // Save post to database

        await dbClient.saveReminder({
            cid: message.commit.cid,
            uri: handlerAgent.generateURIFromCreateMessage(message),
            did: message.did,
            reply: handlerAgent.generateReplyFromMessage(message),
            messageText: postText,
            reminderDate: new Date(reminderDate),
            timezone: timezone
        })
        DebugLog.warn("INSERT", `Created Post with CID: ${message.commit.cid}`)
    }
}

export class ReplyWithDataFromDatabase extends AbstractMessageAction {

    constructor(private formattingAction: (arg0: any) => string) {
        super();
    }

    async handle(handlerAgent: HandlerAgent, message: JetstreamEventCommit ): Promise<any> {
        let post = await dbClient.getPostFromCid(message.commit.cid)
        if (!post) {
            DebugLog.error("REPLY", "Post not found in database")
            return;
        }

        let responseText = this.formattingAction(post)
        await handlerAgent.createSkeet(responseText, handlerAgent.generateReplyFromMessage(message))
        DebugLog.warn("REPLY", `Responded with: ${responseText}`);
        return;
    }
}