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
import {extractTimezone} from "time-decoding-utils";
import moment from "moment-timezone";
import * as chrono from "chrono-node";
moment.tz.link(
    require('../utils/tz.json').links
)

export class InsertPostReminderInToDatabase extends AbstractMessageAction {

    constructor(private commandKey: string) {
        super();
    }

    async handle(message: CreateSkeetMessage, handlerAgent: HandlerAgent): Promise<any> {
        // Get timing from post
        let timeString: string | boolean;
        let reminderDate: string;
        let timezone: string | boolean;
        try {
            let postText: string = message.record.text ?? "";
            timeString = trimCommandInput(postText, this.commandKey);
            if (typeof timeString == "boolean") {
                DebugLog.error("INSERT", `Trim command returned false: ${message.record.text}`)
                return;
            }

            timezone = extractTimezone(timeString)
            if (typeof timezone === "boolean") {
                timezone = "America/Chicago"
            }

            let timezoneAbbr = moment.tz(timezone).zoneAbbr()

            let parsedDate = chrono.parseDate(timeString,
                {
                    timezone: timezoneAbbr,
                });

            if(parsedDate == null){
                throw new Error("Parsed date invalid")
            }

            reminderDate = parsedDate.toISOString();
        } catch (e) {
            // @ts-ignore
            DebugLog.error("INSERT", e + `: ${message.record.text}`)
            // console.log("ERROR - Exception")
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(message, handlerAgent);
            return;
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

    async handle(message: CreateSkeetMessage, handlerAgent: HandlerAgent): Promise<any> {
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