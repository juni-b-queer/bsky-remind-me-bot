import {PostHandler} from "../abstract-handler.ts";
import {InputStartsWithValidator} from "../../validators/string-validators.ts";
import {LogPostDetailsAction} from "../../actions/logging-actions.ts";
import {InsertPostReminderInToDatabase} from "../../database/database-handler-actions.ts";

export let RemindMeHandler = new PostHandler(
    [new InputStartsWithValidator('RemindMe!', true)],
    [new LogPostDetailsAction(), new InsertPostReminderInToDatabase()],
    false
)
