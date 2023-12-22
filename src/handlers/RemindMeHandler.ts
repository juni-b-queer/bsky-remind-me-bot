// import {PostHandler} from "../abstract-handler.ts";
import {InputIsCommandValidator, PostHandler, getHumanReadableDateTimeStamp} from "bsky-event-handlers";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../database/database-handler-actions.ts";
import {Post} from "../database/database-connection.ts";
// import {} from "../../utils/time-utils.ts";

const COMMAND = "RemindMe"
export let RemindMeHandler = new PostHandler(
    [new InputIsCommandValidator(COMMAND)],
    [new InsertPostReminderInToDatabase(COMMAND), new ReplyWithDataFromDatabase(Post, 'reminderDate', responseGenerator)],
    false
)

export function responseGenerator(inputDate) {
    return `Reminder set for ${getHumanReadableDateTimeStamp(inputDate)}`
}