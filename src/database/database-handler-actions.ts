import {
    AbstractMessageAction,
    CreateSkeetMessage,
    DebugLog,
    HandlerAgent, JetstreamEventCommit, MessageHandler, NewSkeetRecord,
    ReplyToSkeetAction, SendDMAction,
    trimCommandInput
} from "bsky-event-handlers";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {extractTimeFromInput, extractTimezone, extractTimezoneAbbreviation} from "time-decoding-utils";
import {dbClient} from "./index.ts";
import {PostTypesEnum} from "./schema.ts";
import * as chrono from "chrono-node";

export class InsertPostReminderInToDatabase extends AbstractMessageAction {

    constructor(private commandKey: string, private silent: boolean = false) {
        super();
    }


    async handle(handlerAgent: HandlerAgent, message: JetstreamEventCommit ): Promise<any> {
        // Get timing from post
        let timeString: string | boolean;
        let reminderDate: string | Date | null;
        let timezone: boolean | string;
        let postText: string



        // if (reminderDate === "") {
        //     //reply with
        //     if(!this.silent){
        //         let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
        //         await replyAction.handle(handlerAgent, message);
        //     }else {
        //         try{
        //             let sendDmAction = SendDMAction.make(
        //                 message.did,
        //                 "The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"",
        //                 MessageHandler.getSubjectFromMessage(handlerAgent, message))
        //             await sendDmAction.handle(handlerAgent, message)
        //         }catch(e){
        //             DebugLog.error("INSERT", `Error sending message to ${message.did}: ${e}`)
        //             return;
        //         }
        //     }
        //     DebugLog.error("INSERT", `empty reminder date: ${message.did} \n ${postText}`)
        //
        //     return;
        // }

        const skeetRecord: NewSkeetRecord = message.commit.record as NewSkeetRecord;
        postText = skeetRecord.text ?? "";
        timeString = trimCommandInput(postText, this.commandKey);
        if(typeof timeString === "boolean"){
            DebugLog.error("INSERT", `empty reminder date: ${message.did} \n ${postText}`)
            return;
        }
        reminderDate = chrono.parseDate(timeString);

        if(!reminderDate){
            timeString = `in ${timeString}`
            reminderDate = chrono.parseDate(timeString);
        }

        if(!reminderDate){
            DebugLog.warn("DATE PARSE", "Falling back to 'in' prefix for text: " + postText)
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

                let noTimezone = false;
                if (!timezone) {
                    timezone = "America/Chicago"
                    noTimezone = true;
                }

                reminderDate = extractTimeFromInput(timeString, timezone, postTime)

            }
            catch (e) {
                // @ts-ignore
                DebugLog.error("INSERT", `Error inserting reminder for ${message.did}: \n ${postText} \n  ${e}`)
                if(!this.silent){
                    let replyAction = new ReplyToSkeetAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
                    await replyAction.handle(handlerAgent, message);
                }else {
                    try{
                        let sendDmAction = SendDMAction.make(
                            message.did,
                            "The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"",
                            MessageHandler.getSubjectFromMessage(handlerAgent, message))
                        await sendDmAction.handle(handlerAgent, message)
                    }catch(e){
                        DebugLog.error("INSERT", `Error sending message to ${message.did}: ${e}`)
                        return;
                    }

                }
                // console.log("ERROR - Exception")

                return;
            }
        }



        let silent = this.silent;
        if(!silent){
            silent = !(await handlerAgent.getAgentCanReply(MessageHandler.getRootUriFromMessage(handlerAgent, message)))
        }
        // Save post to database
        await dbClient.saveReminder({
            cid: message.commit.cid,
            uri: handlerAgent.generateURIFromCreateMessage(message),
            did: message.did,
            reply: handlerAgent.generateReplyFromMessage(message),
            messageText: postText,
            reminderDate: new Date(reminderDate),
            postType: PostTypesEnum.REMINDER,
            silent: silent,
            timezone: ""
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
            DebugLog.error("REPLY", `Post ${message.commit.cid} not found in database`)
            return;
        }

        let responseText = this.formattingAction(post)
        await handlerAgent.createSkeet(responseText, handlerAgent.generateReplyFromMessage(message))
        DebugLog.warn("REPLY", `Responded with: ${responseText}`);
        return;
    }
}

export class MessageWithDataFromDatabase extends AbstractMessageAction {

    constructor(private formattingAction: (arg0: any) => string) {
        super();
    }

    async handle(handlerAgent: HandlerAgent, message: JetstreamEventCommit ): Promise<any> {
        let post = await dbClient.getPostFromCid(message.commit.cid)
        if (!post) {
            DebugLog.error("REPLY", `Post ${message.commit.cid} not found in database`)
            return;
        }

        let responseText = this.formattingAction(post)

        const uri = MessageHandler.getUriFromMessage(handlerAgent, message);
        try{
            await handlerAgent.sendMessageToUser(message.did, responseText, {
                cid: message.commit.cid,
                uri: uri
            })
        }catch(e){
            DebugLog.error("REPLY", `Error sending message to ${message.did}: \n ${uri} \n ${e}`)
            return;
        }


        DebugLog.warn("REPLY", `Sent DM with: ${responseText}`);
        return;
    }
}


export class InsertRepostOrDeleteIntoDatabase extends AbstractMessageAction {

    constructor(private commandKey: string, private postType: PostTypesEnum) {
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
            DebugLog.error("INSERT", `Error inserting ${this.postType} for ${message.did}: \n ${postText} \n  ${e}`)
            return;
        }


        if (reminderDate === "") {
            DebugLog.error("INSERT", `empty ${this.postType} date: ${message.did} \n ${postText}`)

            return;
        }

        const reply = {
                root: {
                    uri: message.commit.record!.reply!.root.uri,
                    cid: message.commit.record!.reply!.root.cid
                },
                parent: {
                    uri: message.commit.record!.reply!.parent.uri,
                    cid: message.commit.cid
                }
            }
        // Save post to database
        await dbClient.saveReminder({
            cid: message.commit.cid,
            uri: handlerAgent.generateURIFromCreateMessage(message),
            did: message.did,
            reply: reply,
            messageText: postText,
            reminderDate: new Date(reminderDate),
            postType: this.postType,
            silent: false,
            timezone: timezone
        })
        DebugLog.warn("INSERT", `Created Post to ${this.postType} with CID: ${message.commit.cid}`)
    }
}