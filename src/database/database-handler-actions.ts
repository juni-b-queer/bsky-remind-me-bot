import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";
import {AbstractTriggerAction} from "../actions/abstract-trigger-action.ts";
import {convertTextToDate} from "../utils/text-utils.ts";
import {ReplyWithInputAction} from "../actions/reply-actions.ts";
import {Post} from "./database-connection.ts";
import {Op} from "sequelize";
import {replyToPost} from "../utils/agent-post-functions.ts";

export class InsertPostReminderInToDatabase extends AbstractTriggerAction{

    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        // Get timing from post
        let timeString: string;
        let reminderDate: string;
        try{
            let postText: string = postDetails.value.text
            console.log(postText)
            if(postText.startsWith("!RemindMe")){
                console.log(postText.replace("!RemindMe ", ""))
                timeString = postText.replace("!RemindMe ", "")
            }else{
                timeString = postText.replace("RemindMe! ", "")
            }

            reminderDate = convertTextToDate(timeString)
        }catch (e) {
            console.log(e)
            let replyAction = new ReplyWithInputAction("The provided input string is invalid. Please use a format like \"1 month, 2 days, 1 hour, and 20 minutes\"")
            await replyAction.handle(agent, op, postDetails);
            return;
        }


        if(reminderDate === ""){
            //reply with
            let replyAction = new ReplyWithInputAction("The provided input string is invalid. Please use a format like \"1 month, 2 days, 1 hour, and 20 minutes\"")
            await replyAction.handle(agent, op, postDetails);
            return;
        }

        // Save post to database
        await Post.create({
            cid: postDetails.cid,
            uri: postDetails.uri,
            postDetails: postDetails,
            reminderDate: reminderDate
        })
    }
}

export class ReplyWithDataFromDatabase extends AbstractTriggerAction{

    constructor(private dbType, private column: string, private formattingAction) {
        super();
    }

    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        let post = await Post.findOne({
            where: {
                cid: {
                    [Op.eq]: postDetails.cid
                },
            }
        });
        if(!post){
            return;
        }

        let columnValue = post[this.column];
        let responseText = this.formattingAction(columnValue)
        return await replyToPost(agent, postDetails, responseText);
    }
}