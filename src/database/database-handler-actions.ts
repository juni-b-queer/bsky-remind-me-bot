import {BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../utils/types.ts";
import {AbstractTriggerAction} from "../actions/abstract-trigger-action.ts";
import {convertTextToDate} from "../utils/text-utils.ts";
import {ReplyWithInputAction} from "../actions/reply-actions.ts";
import { format } from "date-fns";
import {Post} from "./database-connection.ts";

export class InsertPostReminderInToDatabase extends AbstractTriggerAction{

    async handle(agent: BskyAgent, op: RepoOp, postDetails: PostDetails): Promise<any> {
        // Get timing from post
        let timeString = postDetails.value.text.split('! ')[1]
        let reminderDate = convertTextToDate(timeString)

        if(reminderDate === ""){
            //reply with
            let replyAction = new ReplyWithInputAction("The provided input string is invalid. Please use a format like \"1 month, 2 days, 1 hour, and 20 minutes\"")
            await replyAction.handle(agent, op, postDetails);
            return;
        }

        // Save post to database
        Post.create({
            cid: postDetails.cid,
            uri: postDetails.uri,
            postDetails: postDetails,
            reminderDate: reminderDate
        })
        // reply to post based on reminder timing
        let reminderDateObject = new Date(reminderDate)
        let humanReadableDateString = format(reminderDateObject, "MMMM do, yyyy 'at' HH:mm");
        let replyAction = new ReplyWithInputAction(
            `Reminder set for ${humanReadableDateString}`
        )
        await replyAction.handle(agent, op, postDetails);
    }
}