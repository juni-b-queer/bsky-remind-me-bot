import {PostHandler} from "../abstract-handler.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";
import {LogPostDetailsAction} from "../../actions/logging-actions.ts";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../../database/database-handler-actions.ts";
import {Post} from "../../database/database-connection.ts";
import {getHumanReadableDateTimeStamp} from "../../utils/time-utils.ts";
import {OrValidator} from "../../validators/abstract-validator.ts";

export let RemindMeHandler = new PostHandler(
    [new OrValidator([new InputStartsWithValidator('RemindMe!', true), new InputStartsWithValidator('!RemindMe', true)])],
    [new InsertPostReminderInToDatabase(), new ReplyWithDataFromDatabase(Post, 'reminderDate', responseGenerator)],
    false
)

export function responseGenerator(inputDate){
    return `Reminder set for ${getHumanReadableDateTimeStamp(inputDate)}`
}