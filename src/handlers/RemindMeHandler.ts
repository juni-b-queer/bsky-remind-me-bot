import {
    InputIsCommandValidator,
    getHumanReadableDateTimeStamp,
    CreateSkeetHandler,
    HandlerAgent,
    CreateSkeetMessage
} from "bsky-event-handlers";
import {InsertPostReminderInToDatabase, ReplyWithDataFromDatabase} from "../database/database-handler-actions.ts";
import {Post, PostAttributes} from "../database/database-connection.ts";

const COMMAND = <string>Bun.env.REMIND_ME_COMMAND ?? "RemindMe"

export class RemindMeHandler extends CreateSkeetHandler{
    constructor(
        public handlerAgent: HandlerAgent,
    ) {
        super(
            [new InputIsCommandValidator(COMMAND, false)],
            [
                new InsertPostReminderInToDatabase(COMMAND),
                new ReplyWithDataFromDatabase(responseGenerator)
            ],
            handlerAgent,
        );
    }

    async handle(message: CreateSkeetMessage): Promise<void> {
        return super.handle(message);
    }
}
// @ts-ignore
export function responseGenerator(post: PostAttributes) {
    let humanReadable: string;
    let output: string;
    try{
        let tz = post['timezone'] !== "" ? post['timezone'] : "CST"
        let suffixTimezone = tz;
        if(suffixTimezone.length === 3){
            suffixTimezone = suffixTimezone.slice(0, 1) + suffixTimezone.slice(2);
        }
        output = `Reminder set for ${getHumanReadableDateTimeStamp(post['reminderDate'], tz)} ${suffixTimezone}`
    }catch (e){
        humanReadable = getHumanReadableDateTimeStamp(post['reminderDate']);
        output = `Reminder set for ${humanReadable} \n(Timezone not recognized, falling back to America/Chicago)`
    }
    return output
}