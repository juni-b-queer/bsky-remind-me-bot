import {PostHandler} from "../abstract-handler.ts";
import {InputIsCommandValidator} from "../../validators/string-validators.ts";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../../database/database-handler-actions.ts";
import {Post} from "../../database/database-connection.ts";
import {getHumanReadableDateTimeStamp} from "../../utils/time-utils.ts";

export let RemindMeHandler = new PostHandler(
    [new InputIsCommandValidator('TRemindMe')],
    [new InsertPostReminderInToDatabase("TRemindMe"), new ReplyWithDataFromDatabase(Post, 'reminderDate', responseGenerator)],
    false
)

export function responseGenerator(inputDate){
    return `Reminder set for ${getHumanReadableDateTimeStamp(inputDate)}`
}