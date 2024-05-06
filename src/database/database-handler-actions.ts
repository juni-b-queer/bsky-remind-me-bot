import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {

    trimCommandInput,
    debugLog, AbstractMessageAction, CreateSkeetMessage, HandlerAgent, DebugLog, ReplyToSkeetAction
} from "bsky-event-handlers";
import {convertTextToDate} from "../utils/text-utils.ts";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {extractTimeFromInput, extractTimezone, extractTimezoneAbbreviation} from "time-decoding-utils";
export class InsertPostReminderInToDatabase extends AbstractMessageAction{

    constructor(private commandKey: string) {
        super();
    }

    async handle(message: CreateSkeetMessage, handlerAgent: HandlerAgent): Promise<any> {
        // Get timing from post
        let timeString: string|boolean;
        let reminderDate: string;
        try{
            let postText: string = message.record.text ?? "";
            timeString = trimCommandInput(postText, this.commandKey);
            if(typeof timeString == "boolean"){
                debugLog("INSERT", "Trim command returned false", 'error')
                return;
            }

            reminderDate = extractTimeFromInput(timeString)
        }catch (e) {
            // @ts-ignore
            DebugLog.error("INSERT", e)
            // console.log("ERROR - Exception")
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(message, handlerAgent);
            return;
        }


        if(reminderDate === ""){
            //reply with
            DebugLog.error("INSERT", "empty reminder date")
            let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(message, handlerAgent);
            return;
        }

        let timezone: boolean | string = extractTimezoneAbbreviation(timeString)
        if(typeof timezone === "boolean"){
            timezone = extractTimezone(timeString)
            if(typeof timezone === "boolean"){
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
        debugLog("INSERT", `Created Post with CID: ${message.cid}`, 'warn')
    }
}

export class ReplyWithDataFromDatabase extends AbstractMessageAction{

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
        if(!post){
            debugLog("REPLY", "Post not found in database", 'error')
            return;
        }

        let responseText = this.formattingAction(post)
        await handlerAgent.createSkeet(responseText, handlerAgent.generateReplyFromMessage(message))
        DebugLog.warn("REPLY", `Responded with: ${responseText}`);
        return;
    }
}