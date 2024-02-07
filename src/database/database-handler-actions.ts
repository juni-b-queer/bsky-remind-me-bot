import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {
    PostDetails,
    AbstractTriggerAction,
    ReplyWithInputAction,
    replyToPost,
    getPosterDID,
    trimCommandInput,
    debugLog,
    AgentDetails
} from "bsky-event-handlers";
import {convertTextToDate} from "../utils/text-utils.ts";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {extractTimeFromInput, extractTimezone, extractTimezoneAbbreviation} from "time-decoding-utils";
export class InsertPostReminderInToDatabase extends AbstractTriggerAction{

    constructor(private commandKey: string) {
        super();
    }

    async handle(agentDetails: AgentDetails, op: RepoOp, postDetails: PostDetails): Promise<any> {
        // Get timing from post
        let timeString: string|boolean;
        let reminderDate: string;
        try{
            let postText: string = postDetails.value.text
            timeString = trimCommandInput(postText, this.commandKey);
            if(typeof timeString == "boolean"){
                debugLog("INSERT", "Trim command returned false", 'error')
                return;
            }

            reminderDate = extractTimeFromInput(timeString)
        }catch (e) {
            debugLog("INSERT", e, 'error')
            // console.log("ERROR - Exception")
            console.log(postDetails)
            let replyAction = new ReplyWithInputAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(agentDetails.agent, op, postDetails);
            return;
        }


        if(reminderDate === ""){
            //reply with
            debugLog("INSERT", "empty reminder date", 'error')
            console.log(postDetails)
            let replyAction = new ReplyWithInputAction("The provided input string is invalid. Please use a format like \"1 month, 2 days\" or \"12/24/2024 at 1pm\"")
            await replyAction.handle(agentDetails.agent, op, postDetails);
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
            cid: postDetails.cid,
            uri: postDetails.uri,
            did: getPosterDID(postDetails),
            postDetails: postDetails,
            reminderDate: reminderDate,
            timezone: timezone
        })
        debugLog("INSERT", `Created Post with CID: ${postDetails.cid}`, 'warn')
    }
}

export class ReplyWithDataFromDatabase extends AbstractTriggerAction{

    constructor(private dbType, private formattingAction) {
        super();
    }

    async handle(agentDetails: AgentDetails, op: RepoOp, postDetails: PostDetails): Promise<any> {
        let post = await Post.findOne({
            where: {
                cid: {
                    [Op.eq]: postDetails.cid
                },
            }
        });
        if(!post){
            debugLog("REPLY", "Post not found in database", 'error')
            return;
        }

        let responseText = this.formattingAction(post)
        await replyToPost(agentDetails.agent, postDetails, responseText)
        debugLog("REPLY", `Responded with: ${responseText}`, 'warn');
        return;
    }
}