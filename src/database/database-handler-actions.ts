import {
    AbstractMessageAction,
    CreateSkeetMessage,
    DebugLog,
    HandlerAgent,
    ReplyToSkeetAction,
    trimCommandInput
} from "bsky-event-handlers";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {extractTimeFromInput, extractTimezone, extractTimezoneAbbreviation} from "time-decoding-utils";

export class InsertPostReminderInToDatabase extends AbstractMessageAction {

    constructor(private commandKey: string) {
        super();
    }

    async handle(handlerAgent: HandlerAgent, message: CreateSkeetMessage ): Promise<any> {
        // Get timing from post
        let timeString: string | boolean;
        let reminderDate: string;
        try {
            let postText: string = message.record.text ?? "";
            timeString = trimCommandInput(postText, this.commandKey);
            if (typeof timeString == "boolean") {
                DebugLog.error("INSERT", `Trim command returned false: ${message.record.text}`)
                return;
            }

            const postTime = new Date(message.record.createdAt);

            reminderDate = extractTimeFromInput(timeString, undefined, postTime)
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
            DebugLog.error("INSERT", `empty reminder date: ${message.record.text}`)
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(handlerAgent, message);
            return;
        }

        let timezone: boolean | string = extractTimezoneAbbreviation(timeString)
        if (typeof timezone === "boolean") {
            timezone = extractTimezone(timeString)
            if (typeof timezone === "boolean") {
                timezone = ""
            }
        }

        // Save post to database

        await Post.create({
            cid: message.cid,
            uri: handlerAgent.generateURIFromCreateMessage(message),
            did: message.did,
            reply: handlerAgent.generateReplyFromMessage(message),
            messageText: message.record.text,
            reminderDate: reminderDate,
            timezone: timezone
        })
        DebugLog.warn("INSERT", `Created Post with CID: ${message.cid}`)
    }
}

export class ReplyWithDataFromDatabase extends AbstractMessageAction {

    constructor(private formattingAction: (arg0: any) => string) {
        super();
    }

    async handle(handlerAgent: HandlerAgent, message: CreateSkeetMessage ): Promise<any> {
        let post = await Post.findOne({
            where: {
                cid: {
                    [Op.eq]: message.cid
                },
            }
        });
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